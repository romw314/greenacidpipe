import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import chalk from 'chalk';
import cz from 'cross-unzip';
import Downloader from 'nodejs-file-downloader';
import { Observable } from 'rxjs';
import Listr from 'listr';
import semverMajor from 'semver/functions/major.js';
import semverMinor from 'semver/functions/minor.js';
import { deleteAsync } from 'del';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let pkg;

export default new Listr([
	{
		title: `Load ${chalk.cyan('package.json')}`,
		task: () => pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'))
	},
	{
		title: `Write ${chalk.cyan('installer/GAPInfo.nsh')}`,
		task: () => fs.writeFileSync(path.resolve(__dirname, '../installer/GAPInfo.nsh'), `
!define GAP_VERSION ${pkg.version}
!define PRODUCT_VERSION ${pkg.version}
!define VERSION ${pkg.version}.0
!define GAP_NAME ${pkg.build.productName}
!define NAME ${pkg.build.productName}
!define GAP_LICENSEDATA "${path.resolve(__dirname, '../license.txt')}"
!define GAP_VERSION_MINOR ${semverMinor(pkg.version)}
!define GAP_VERSION_MAJOR ${semverMajor(pkg.version)}

!macro GAP_INIT
	OutFile "..\\dist\\${pkg.build.productName} v${pkg.version} Setup.exe"
	VIProductVersion "\${PRODUCT_VERSION}"
	VIFileVersion "\${VERSION}"
	Name "\${NAME}"
!macroend
`)
	},
	{
		title: `Write ${chalk.cyan('installer/appid.json')}`,
		task: () => fs.writeFileSync(path.resolve(__dirname, '../installer/appid.json'), JSON.stringify({ appName: 'GreenAcidPipe', clientId: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../appid.json'))).clientId }))
	},
	{
		title: `Delete the ${chalk.cyan('installer/node_modules')} directory`,
		skip: () => fs.existsSync(path.resolve(__dirname, '../installer/node_modules')) ? false : 'The directory does not exist',
		task: () => deleteAsync(path.resolve(__dirname, '../installer/node_modules'))
	},
	{
		title: `Create the ${chalk.cyan('installer/node_modules')} directory`,
		task: () => fs.mkdirSync(path.resolve(__dirname, '../installer/node_modules'))
	},
	{
		title: `Change directory`,
		task: () => process.chdir(path.resolve(__dirname, '..'))
	},
	{
		title: 'Install dependencies with yarn',
		task: (ctx, yarn) => execa('yarn', ['install', '--production', '--modules-folder', path.resolve(__dirname, '../installer/node_modules')]).catch(() => {
			ctx.yarn = false;
			task.skip('Yarn is not available');
		})
	},
	{
		title: 'Install dependencies with npm',
		enabled: ctx => ctx.yarn === false,
		task: () => execa('npm', ['install', '--prefix', path.join('.', 'installer'), '--production'])
	},
	{
		title: `Change directory to ${chalk.cyan('installer')}`,
		task: () => process.chdir(path.resolve(__dirname, '../installer'))
	},
	{
		title: 'Prepare necessary software',
		task: () => new Listr([
			{
				title: 'Prepare ConEmu',
				skip: () => fs.existsSync(path.resolve(__dirname, '../installer/conemu')) ? 'ConEmu is already prepared' : false,
				task: () => new Listr([
					{
						title: 'Download ConEmu',
						skip: () => fs.existsSync(path.resolve(__dirname, '../installer/conemu.7z')) ? 'ConEmu is already downloaded' : false,
						task: () => new Downloader({
							url: 'https://github.com/Maximus5/ConEmu/releases/download/v23.07.24/ConEmuPack.230724.7z',
							directory: path.resolve(__dirname, '../installer'),
							fileName: 'conemu.7z',
							cloneFiles: false
						}).download()
					},
					{
						title: 'Unpack ConEmu',
						task: () => new Promise((resolve, reject) => cz.unzip(path.resolve(__dirname, '../installer/conemu.7z'), path.resolve('../installer/conemu'), err => err ? reject(err) : resolve()))
					},
				])
			},
			{
				title: 'Prepare Node.js',
				skip: () => fs.existsSync(path.resolve(__dirname, '../installer/node')) ? 'Node.js is already prepared' : false,
				task: () => new Listr([
					{
						title: 'Download Node.js',
						skip: () => fs.existsSync(path.resolve(__dirname, '../installer/node.7z')) ? 'Node.js is already downloaded' : false,
						task: () => new Downloader({
							url: 'https://nodejs.org/download/release/v18.18.2/node-v18.18.2-win-x86.7z',
							directory: path.resolve(__dirname, '../installer'),
							fileName: 'node.7z',
							cloneFiles: false
						}).download()
					},
					{
						title: 'Unpack Node.js',
						task: () => new Promise((resolve, reject) => cz.unzip(path.resolve(__dirname, '../installer/node.7z'), path.resolve('../installer/node'), err => err ? reject(err) : resolve()))
					}
				])
			}
		])
	},
	{
		title: 'Create the installer with NSIS',
		task: () => new Observable(observer => {
			observer.next(`Execute ${chalk.cyan('makensis /INPUTCHARSET UTF8 Install.nsi')}`);
			execa('makensis', ['/INPUTCHARSET', 'UTF8', 'Install.nsi']).then(() => observer.complete()).catch(error => {
				if (error.stderr === undefined)
					observer.error(error);
				observer.error(new Error(`
${chalk.red(error.message)}

---- STDOUT ----
${chalk.cyan(error.stdout)}

---- STDERR ----
${chalk.red(error.stderr)}
				`));
			});
		})
	}
]);
