const csvdata = require('csvdata');
const JSSoup = require('jssoup').default;
const fetch = require('node-fetch');

const actionArtist = (artistName) => {
    return new Promise(async (resolve, reject) => {
        const HTML = await scrapeArtist(`https://www.society6.com/${artistName}`);
        const { bio, name, designs } = await getArtistInfo(HTML);
        await saveArtist(bio, name, designs, `https://www.society6.com/${artistName}`);
        resolve();
    });
}

const scrapeArtist = (artist) => {
    return new Promise(async (resolve, reject) => {
    
        let response = await fetch(artist).catch((err) => {
            reject(err);
        });

        response = await response.text();
        resolve(response);
    });
}

const getArtistInfo = (HTML) => {
    return new Promise((resolve, reject) => {
        try {
            const soup = new JSSoup(HTML);
            const nameElement = soup.find('h2', attrs={ class: 'shopName_about_ieGGS' });
            const bioElement = soup.find('div', attrs={ class: 'aboutTextCollapsed_about_3SIzj' });
            const designsCount = soup.find('a', attrs={ 'data-gtm-event': 'designs count' });

            var bio;
            var name;
            var designs;

            if (bioElement) {
                bio = bioElement.text.replace(/\n/g, "").replace(/,/g, "");
            } else {
                let bio = null;
            }

            if (nameElement) {
                name = nameElement.text;
            } else {
                name = null;
            }

            if (designsCount) {
                designs = designsCount.text.replace("Designs", "")
                console.log(designs);
                if (designs.includes("k")) {
                    designs = parseFloat(designs.replace("k", "")) * 1000;
                } else {
                    designs = parseFloat(designs);
                }
            } else {
                designs = null;
            }

            resolve({ bio: bio, name: name, designs: designs });


        } catch(err) {
            reject(err);
        }
    });
}

const saveArtist = (bio, name, designs, link) => {
    return new Promise(async (resolve, reject) => {
        if (designs < 20) {
            console.log(designs);
            console.log("here");
            return resolve();
        }
        const artistObject = {
            DONE: "",
            link: link,
            name: name,
            designs: designs,
            bio: bio,
        }

        const data = await csvdata.load("./artists.csv");


        for (var datum of data) {
            if (datum.link === artistObject.link) {
                return resolve();
            }
        }

        await csvdata.write("./artists.csv", [artistObject], {
            append: true,
            header: 'DONE,link,name,designs,bio',
        }).then(() => {
            resolve();

        }).catch((err) => {
            reject(err);
        })

    });
}

const scrapeDiscover = (pageNumber) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (pageNumber < 1) {
                reject(`${pageNumber} is not a valid page number.`);
            }
        } catch(err) {
            reject(err);
        }
    
        let response = await fetch(`https://society6.com/discover?page=${pageNumber}`).catch((err) => {
            reject(err);
        });

        response = await response.text();
        resolve(response);
    });
}

const processDiscover = (HTML) => {
    return new Promise((resolve, reject) => {

        try {
            const soup = new JSSoup(HTML);
            const artistElements = soup.findAll('a', attrs={ class: 'author', 'data-gaq': 'author' });
    
            let artistLinks = [];

            for (var artistElement of artistElements) {
                let artistLink = artistElement.attrs.href;
                artistLink = `https://society6.com${artistLink}`;
                artistLinks.push(artistLink);
            }

            resolve(artistLinks);

        } catch(err) {
            reject(err);
        }
    });
}

const actionDiscover = (pageNumber) => {
    return new Promise(async (resolve, reject) => {
        const HTML = await scrapeDiscover(pageNumber);
        const links = await processDiscover(HTML);
        resolve(links);
    })

}

const scrapeFollowers = (artistName) => {
    return new Promise(async (resolve, reject) => {
        let response = await fetch(`https://www.society6.com/${artistName}/followers`).catch((err) => {
            reject(err);
        });

        response = await response.text();
        resolve(response);
    });
}

const processFollowers = (HTML) => {
    return new Promise((resolve, reject) => {

        try {
            const soup = new JSSoup(HTML);
            const artistElements = soup.findAll('a', attrs={ class: 'user' });
    
            let followerLinks = [];

            for (var follower of artistElements) {
                let followerLink = follower.attrs.href;
                followerLink = `https://society6.com${followerLink}`;
                followerLinks.push(followerLink);
            }

            resolve(followerLinks);

        } catch(err) {
            reject(err);
        }
    });
}

const actionFollowers = (artistName) => {
    return new Promise(async (resolve, reject) => {
        const HTML = await scrapeFollowers(artistName);
        const links = await processFollowers(HTML);
        resolve(links);
    })
}

const index = async (options) => {
    return new Promise(async (resolve, reject) => {
        let discoverCount = 1;

        while (true) {
            let discoverArtists = await actionDiscover(discoverCount);
            for (var discoverArtist of discoverArtists) {
                await actionArtist(discoverArtist.replace("https://society6.com/", ""));
                let followerArtists = await actionFollowers(discoverArtist.replace("https://society6.com/", ""));
                for (var followerArtist of followerArtists) {
                    await actionArtist(followerArtist.replace("https://society6.com/", ""));
                }
            }
            discoverCount++;
        }
    })
}

index({})

/*index({
    maxArtists: null, //set to a number if you want to limit the max number of artists checked
    collectEmails: true, //set to a boolean to collect or not collect emails
    collectHandles: true, //set to a boolean to collect or not collect social media handles
    collectWebsites: true, //set to a boolean to collect or not collect websites
});
*/