import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv'

dotenv.config();

const APP_NAME = process.env.APP_NAME;
const USERNAME = process.env.GITHUB_USERNAME;
const PASSWORD = process.env.GITHUB_PASSWORD;
if (!APP_NAME) throw new Error('APP_NAME is not defined in .env file');
if (!USERNAME) throw new Error('GITHUB_USERNAME is not defined in .env file');
if (!PASSWORD) throw new Error('GITHUB_PASSWORD is not defined in .env file');

const INSTALL_TARGET_LOGIN = 'austenstone';

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // debug
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto('https://github.com/login');

    await page.type('#login_field', USERNAME);
    await page.type('#password', PASSWORD);
    await page.click('form input[type="submit"]');

    await page.waitForSelector('.logged-in');
    await page.goto(`https://github.com/settings/apps/${APP_NAME}/installations`);

    await page.waitForSelector('.Box a');
    const found = (await page.$$('.Box .Box-row')).find(async (box) => {
        const span = await box.$('span');
        const text = await span?.evaluate(el => el.textContent);
        return text?.trim() === INSTALL_TARGET_LOGIN;
    });
    if (!found) throw new Error('Install target was not found');

    const installButton = await found.$('a');
    if (!installButton) throw new Error('Install button was not found');
    installButton.click();

    await page.waitForSelector('.integrations-auth-wrapper button');
    const buttons = await page.$$('.integrations-auth-wrapper button');
    const installButton2 = buttons.find(async (button) => {
        const text = await button?.evaluate(el => el.textContent);
        return text?.trim() === 'Install';
    });
    if (!installButton2) throw new Error('Install button was not found');

    installButton2.click();

    await browser.close();
})();