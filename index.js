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
            const followerCountElement = soup.find('p', attrs={ class: 'stat_shopStatsBar_3czvW' });
            const followingCountElement = soup.find('p', attrs={ class: 'statDetail_shopStatsBar_33Zx0' });
            stat_shopStatsBar_3czvW


            console.log(followingCountElement.text);

            resolve({ bio: bioElement.text, name: nameElement.text });


        } catch(err) {
            reject(err);
        }
    });
}

const processArtist = (bio, emails, handles, websites) => {

}

const saveArtist = (email, handle, website) => {

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
    if (options.maxArtists) {
        for (var i = 0; i < options.maxArtists; i++) {

        }
    } else {
        let discoverCount = 1;
        while (true) {
            let discover = await scrapeDiscover(discoverCount).catch((err) => {

            });

            let artists = await processDiscover(discover).catch((err) => {

            });

            for (var artist of artists) {
                let artistBio = await scrapeArtist(artist).catch((err) => {

                });
                let { email, handle, website } = await processArtist(artistBio).catch((err) => {

                })
                if (email !== null || handle !== null || website !== null) {
                    await saveArtist(email, handle, website).catch((err) => {
                        
                    });
                }
            }

            discoverCount++;
        }
    }
}

const testing = async () => {
    let res = await scrapeDiscover(1);
    let artistlinks = await processDiscover(res);
    const result = await scrapeArtist(artistlinks[0]);
    const bio = await getArtistInfo(result);
}

testing();


/*index({
    maxArtists: null, //set to a number if you want to limit the max number of artists checked
    collectEmails: true, //set to a boolean to collect or not collect emails
    collectHandles: true, //set to a boolean to collect or not collect social media handles
    collectWebsites: true, //set to a boolean to collect or not collect websites
});
*/