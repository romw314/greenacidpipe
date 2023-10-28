import chalk from 'chalk';
import figlet from 'figlet';
import { Octokit } from '@octokit/core';
import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import { createOrUpdateTextFile } from '@octokit/plugin-create-or-update-text-file';
import pressAnyKey from 'press-any-key';
import path from 'node:path';
import fs from 'node:fs';
import url from 'node:url';
import prompts from 'prompts';
import fetch from 'node-fetch';
import Listr from 'listr';
import { escape } from 'html-escaper';
import express from 'express';
import Downloader from 'nodejs-file-downloader';
import extract from 'extract-zip';
import run from 'run-program';
import { deleteAsync } from 'del';

const art = (...args) => new Promise((resolve, reject) => figlet(...args, (err, data) => err ? reject(err) : resolve(data)));

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const id = (() => {
	let appIdPath;
	
	function testAppId(p) {
		if (appIdPath)
			return;
		if (fs.existsSync(p))
			appIdPath = p;
	}

	testAppId(path.resolve(process.cwd(), 'appid.json'));
	testAppId(path.resolve(__dirname, '..', 'appid.json'));
	testAppId(path.resolve(__dirname, 'appid.json'));

	return JSON.parse(fs.readFileSync(appIdPath));
})();

const artLogo = async () => console.log(chalk.yellow(await art('GreenAcidPipe')));

const wrapContent = (content, title) => {
	return `<!-- Site bootstrapped with GreenAcidPipe -->
<!DOCTYPE html>
<html><head><title>${title}</title><link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet"/><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossorigin="anonymous"><script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" integrity="sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmUb0ZY0l8" crossorigin="anonymous"></script></head><body style="background-color:lightsalmon;color:darkgreen;"><h1>${title} - Made with <a href="https://greenacidpipe.vercel.app">GreenAcidPipe/RedGas</a></h1><div id="site_content">
<!-- Start RedGas content -->
${content}
<!-- End RedGas content -->
</div>
<!-- Bootstrapped with GreenAcidPipe
     https://greenacidpipe.vercel.app
  -->`;
};

// this does not work for now
const vercelConnect = token => new Promise((resolve, reject) => fetch('https://api.vercel.com/v9/projects', {
	method: 'POST',
	body: JSON.stringify({
		name: `gap1-site-${lowerName}`,
		gitRepository: {
			repo: `${login}/GAP-${name}`,
			type: 'github'
		}
	}),
	headers: {
		Authorization: `Bearer ${token}`
	}
}).then(res => (res.status / 100 === 2) ? resolve() : res.text().then(body => reject(new Error(`${res.status}:\n\n\n:*\n${body}`)))));

const vercelGUIServer = async (opts) => {
	const app = express();
	let close = () => {};
	const done = new Promise(resolve => close = resolve);
	app.get('/opt/:id', (req, res) => {
		res.send(opts[req.params.id]);
		console.log(chalk.blue(`Connection: get opt ${req.params.id}`));
	});
	app.get('/done', () => {
		console.log(chalk.blue(`Connection: done`));
		close();
	});

	const server = app.listen(18349);
	console.log(chalk.yellow('Waiting for GAP_VL (GreenAcidPipe Vercel login)...'));
	
	const fileName = 'vl.zip';
	await new Downloader({
		url: 'https://github.com/romw314/VL-GAP/releases/download/0002-gap/net6.0-windows.zip',
		directory: __dirname,
		fileName,
		cloneFiles: false
	}).download();

	fs.mkdirSync(path.join(__dirname, 'main.vl'));
	await extract(path.join(__dirname, fileName), { dir: path.join(__dirname, 'main.vl') });
	const oldDir = process.cwd();
	process.chdir(path.join(__dirname, 'main.vl'));
	await new Promise((resolve, reject) => run(path.join(__dirname, 'main.vl', 'VL_GreenAcidPipe.exe'), [], err => err ? reject(err) : resolve()));
	process.chdir(oldDir);
	fs.unlinkSync(path.join(__dirname, fileName));

	await done;
	await deleteAsync(path.join(__dirname, 'main.vl'));
	server.close();
	console.log(chalk.magenta('OK'));
};

const mainPart = async () => {
	console.log(chalk.magenta(`If you haven't already installed GAP on your GitHub account, install it here: ${chalk.cyan('https://github.com/apps/greenacidpipe/installations/new')}`));
	await pressAnyKey().catch(() => {});
	console.log(id);
	console.log(chalk.cyan('Using the client id', chalk.bold(id.clientId) + '.'));
	const auth = createOAuthDeviceAuth({
		clientType: 'github-app',
		clientId: id.clientId,
		onVerification: async (verification) => {
			console.log(chalk.magenta('First copy your one-time code:', chalk.bold(verification.user_code)));
			await pressAnyKey().catch(() => {});
			console.log(chalk.magenta('Now open', chalk.bold(verification.verification_uri), 'in your browser and paste the code.'));
		}
	});
	const { token } = await auth({
		type: "oauth"
	});

	const MyOctokit = Octokit.plugin(createOrUpdateTextFile);

	const octokit = new MyOctokit({ auth: token });

	const headers = {
		'X-GitHub-Api-Version': '2022-11-28'
	};

	const { login } = await octokit.request('GET /user', {
		headers
	}).then(res => {
		console.log('Got response about user info:');
		console.log(res);
		return res.data;
	}).then(data => {
		console.log('Got data:');
		console.log(data);
		return data;
	});

	console.log(chalk.magenta(`Authenticated as ${chalk.yellow.bold(login)}.`));

	const { name, description } = await prompts([
		{
			type: 'text',
			name: 'name',
			message: "Enter the name of the project (use hyphens '-' instead of spaces, e.g. My-Awesome-Site)"
		},
		{
			type: 'text',
			name: 'description',
			message: 'Enter the description of the project',
			initial: 'Made with GreenAcidPipe'
		},
	]);

	const lowerName = name.toLowerCase();

	const verbose = false;

	const content = '<p>This is your first paragraph. Use RedGas to edit this site.</p>';
	const humanReadableName = name.replaceAll('-', ' ').replaceAll('@ghrepo@', `${login}/GAP-${name}`);

	const tasks = new Listr([
		{
			title: 'Create GitHub repository',
			task: () => octokit.request('POST /user/repos', {
				name: `GAP-${name}`,
				description,
				homepage: `https://gap1-site-${lowerName}.vercel.app`,
				headers
			})
		},
		{
			title: 'Bootstrap the website',
			task: () => new Listr([
				{
					title: 'Create index.html',
					task: async () => {
						return await octokit.createOrUpdateTextFile({
							owner: login,
							repo: `GAP-${name}`,
							path: 'index.html',
							content: () => {
								const result = wrapContent(content, humanReadableName);
								if (verbose) {
									console.log(chalk.cyan('Index content requested:'));
									console.log(chalk.bold(result));
								}
								return result;
							},
							message: 'Initialize index.html'
						});
					}
				},
				{
					title: 'Create index.html.in',
					task: async () => {
						return await octokit.createOrUpdateTextFile({
							owner: login,
							repo: `GAP-${name}`,
							path: 'index.html.in',
							content: () => {
								const result = wrapContent('%(site_content)', humanReadableName);
								if (verbose) {
									console.log(chalk.cyan('Index.in content requested:'));
									console.log(chalk.bold(result));
								}
								return result;
							},
							message: 'Initialize index.html'
						});
					}
				},
				{
					title: 'Create site_content.html.placeholder',
					task: async () => {
						return await octokit.createOrUpdateTextFile({
							owner: login,
							repo: `GAP-${name}`,
							path: 'site_content.html.placeholder',
							content: () => {
								if (verbose) {
									console.log(chalk.cyan('SC.placeholder content requested:'));
									console.log(chalk.bold(content));
								}
								return content;
							},
							message: 'Initialize index.html'
						});
					}
				}
			])
		}
	]);

	await tasks.run();
	await vercelGUIServer({ login, appName: name });
	console.log(chalk.bold.green.inverse(`Your site is live on ${chalk.yellow(`https://gap1-site-${lowerName}.vercel.app`)}!`));
};

if (process.argv[1] === url.fileURLToPath(import.meta.url)) // if invoked via node
	artLogo().then(mainPart); // then run the program

export default () => artLogo().then(mainPart);
export { artLogo as logo, wrapContent, vercelConnect };
