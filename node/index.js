require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bent = require('bent');

// Environment
const APP_PORT = process.env.APP_PORT;
const API_KEY_ID = process.env.API_KEY_ID;
const API_KEY_SECRET = process.env.API_KEY_SECRET;
const OPEN_API_HOST = process.env.OPEN_API_HOST;
const LINK_API_HOST = process.env.LINK_API_HOST;
// Configuration
const SMILE_OPEN_API_SIGNATURE = Buffer.from(API_KEY_ID + ':' + API_KEY_SECRET).toString('base64');

// App
const app = express();
app.use(cors());
app.use(express.static('../frontend'));
app.get('/api/create_link_token', async (request, response, next) => {
    const post = bent(OPEN_API_HOST, 'POST', 'json', 201);
    const createUserResult = await post('/users', {}, {"Authorization": "Basic " + SMILE_OPEN_API_SIGNATURE});

    const linkInitData = createUserResult.data.token;
    /**
     * The Link API Host, Sandbox and Production mode are using different API hosts.
     */
    linkInitData.apiHost =LINK_API_HOST
    /**
     * Use provider id to promote certain providers to the top of the list. Example ['upwork', 'freelancer'].
     */
    linkInitData.topProviders = []
    /**
     * Use provider id to filter provider list. Example ['upwork', 'freelancer']
     */
    linkInitData.providers= []
    /**
     * upload function switch
     */
    linkInitData.enableUpload = false

    response.json(linkInitData);
});
app.listen(APP_PORT, () => {
    console.log(`Example app listening at http://localhost:${APP_PORT}`)
})

// Loop
const getJSON = bent('json');
let items = []
let init = false
const checkNewIdentities = async () => {
    let cursor = ''
    let size = 2
    let result;
    try {
        result = await getJSON(`${OPEN_API_HOST}/identities?size=${size}&cursor=${cursor}`, {}, {"Authorization": "Basic " + SMILE_OPEN_API_SIGNATURE});
    } catch (error) {
        console.log('error: ', error);
    }
    if (result && result.data.items.length > 0) {
        result.data.items.forEach(item => {
            if (items.indexOf(item.id) < 0 ) {
                items.push(item.id)
                if (init) {
                    console.log(item);
                }
            }
        })

    }
    init = true
};
setInterval(checkNewIdentities, 5000);
