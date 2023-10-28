import Listr from 'listr';
import chalk from 'chalk';
import { Observable } from 'rxjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import buildNsis from './nsis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await new Listr([
	{
		title: `Create the ${chalk.cyan('dist')} directory`,
		task: (ctx, task) => new Observable(observer => {
			try {
				observer.next('Try to create the directory');
				fs.mkdirSync(path.resolve(__dirname, '../dist'));
			}
			catch (error) {
				observer.next('Catch the error');
				error.gap = { againSend: 'nsis' };
				if (error.code !== 'EEXIST')
					observer.error(error);
				observer.next('Directory already exists, skipping...');
				task.skip('Directory already exists');
			}
			observer.complete();
		})
	},
	{
		title: 'Making distributables',
		task: () => new Listr([
			{
				title: `Making a ${chalk.magenta('nsis')} distributable`,
				task: () => buildNsis
			}
		])
	}
]).run();
