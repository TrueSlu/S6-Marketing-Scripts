const csvdata = require('csvdata');
const JSSoup = require('jssoup').default;
const fetch = require('node-fetch');

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
            } else {
                designs = null;
            }

            resolve({ bio: bio, name: name, designs: designs });


        } catch(err) {
            reject(err);
        }
    });
}

const processArtist = (bio, emails, handles, websites) => {
    return new Promise((resolve, reject) => {
        
    });
}

const saveArtist = (bio, name, designs, link) => {
    return new Promise(async (resolve, reject) => {
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

const index = async (options) => {

    let discoverCount = 1;
    while (true) {
        console.log(discoverCount);
        let discover = await scrapeDiscover(discoverCount).catch((err) => {
            console.log(err);
        });

        let artists = await processDiscover(discover).catch((err) => {
            console.log(err);
        });

        for (var artist of artists) {
            let artistBio = await scrapeArtist(artist).catch((err) => {
                console.log(err);
            });

            const { bio, name, designs } = await getArtistInfo(artistBio).catch((err) => {
                console.log(err);
            })

            await saveArtist(bio, name, designs, artist).catch((err) => {
                console.log(err);
            })


        }

        discoverCount++;
    }
}

index({})

/*index({
    maxArtists: null, //set to a number if you want to limit the max number of artists checked
    collectEmails: true, //set to a boolean to collect or not collect emails
    collectHandles: true, //set to a boolean to collect or not collect social media handles
    collectWebsites: true, //set to a boolean to collect or not collect websites
});
*/