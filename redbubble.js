const csvdata = require('csvdata');
const JSSoup = require('jssoup').default;
const fetch = require('node-fetch');

const scrapeTopSellingStickers = (max) => {
    return new Promise(async (resolve, reject) => {
        let count = 0;
        while (count < max) {
            response = await fetch("https://www.redbubble.com/shop/top+selling+stickers?ref=sort_order_change_top_selling&page=" + count);
            HTML = await response.text();

            const soup = new JSSoup(HTML);
            const arts = soup.findAll('a', attrs={ class: 'styles__normalLink--2LmvE' });
            
            for (var art of arts) {
                temphref = art.attrs.href;
                artistName = temphref.split("/")[2];
                let inList = await checkArtist(artistName);
                if (!inList) {
                    await actionArtist(artistName);
                } else {
                    console.log("In list.");
                }
            }
            count++;
        }
    })
}

const actionArtist = (artistName) => {
    return new Promise(async (resolve, reject) => {
        console.log("Getting artist " + artistName);
        const HTML = await scrapeArtist(artistName);
        const { bio, name, designs } = await getArtistInfo(HTML);
        await saveArtist(bio, artistName, `https://www.redbubble.com/people/${artistName}`);
        resolve();
    });
}

const scrapeArtist = (artistName) => {
    return new Promise(async (resolve, reject) => {
    
        let response = await fetch(`https://www.redbubble.com/people/${artistName}`).catch((err) => {
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
            const bioElement = soup.find('p', attrs={ class: 'app-entries-artistProfile-components-ProfileInfo-ProfileInfo_shortBioText_3nXbY' });

            var bio;

            if (bioElement) {
                bio = bioElement.text.replace(/\n/g, "").replace(/,/g, "").replace(/;/g, "");
            } else {
                let bio = null;
            }

            resolve({ bio: bio });


        } catch(err) {
            reject(err);
        }
    });
}

const saveArtist = (bio, name, link) => {
    return new Promise(async (resolve, reject) => {


        if (bio === null || bio === "" || bio === undefined) {
            console.log("No bio");
            return resolve();
        }

        if (!bio.includes("@")) {
            console.log("Didn't find any keywords");
            return resolve();
        }


        const artistObject = {
            name: name,
            bio: bio,
            link: link,
        }

        await csvdata.write("./sheets/redbubble.csv", [artistObject], {
            append: true,
            header: 'link,name,bio',
        }).then(() => {
            resolve();

        }).catch((err) => {
            reject(err);
        })

    });
}

const checkArtist = (name) => {
    return new Promise(async (resolve, reject) => {
        var stop = 0;
        csvdata.load("./sheets/trash.csv").then((data) => {
            for (var datum of data) {
                if (datum.name === name) {
                    stop = 1;
                    return resolve(true);
                }
            }

            if (stop === 0) {
                csvdata.write("./sheets/trash.csv", [{ name: name }], { append: true, header: 'name' }).then(() => {
                    return resolve(false);
                })
            }
        })
    });
}

scrapeTopSellingStickers(100);

/*index({
    maxArtists: null, //set to a number if you want to limit the max number of artists checked
    collectEmails: true, //set to a boolean to collect or not collect emails
    collectHandles: true, //set to a boolean to collect or not collect social media handles
    collectWebsites: true, //set to a boolean to collect or not collect websites
});
*/