#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net

import { Server, EVENTS } from "npm:@tus/server@1.0.0-beta.5";
import { FileStore } from "npm:@tus/file-store@1.0.0-beta.1";
import express from "npm:express";

import ClamAV from './clamav.ts';

const filepath: string = './files';
const filerelpath: string = './files';
const host: string = '127.0.0.1';
const port: integer = 1080;

const clamav = new ClamAV({ port: 3310, host: '127.0.0.1' });

console.log('ClamAV Daemon Connection: ', await clamav.version());

async function clamavscan(filename: string)
{
  const filepath: string = `${filerelpath}/${filename}`;

  const response: string = await clamav.scan(await Deno.open(filepath));

  console.log(`[clamav] ${filepath} "${response}"`);

  if(response === 'stream: OK')
  {
    return true;
  }

  // Delete file
  await Deno.remove(filepath);

  return false;
}

const app = express();
const uploadApp = express();

let uploadDirectory = [];

async function uploadDirectoryAdd(id, filename)
{
  const fileInfo = await Deno.statSync(`${filerelpath}/${id}`);

  uploadDirectory.push({
    id: id,
    filename: filename,
    size: fileInfo.size,
    lmod: fileInfo.mtime
  });
}

const UploadStore = new FileStore({ directory: filerelpath });

const server = new Server(
{
  path: '/files',
  datastore: UploadStore,
  async onUploadFinish(req, res, upload)
  {
    const virus_ok: boolean = await clamavscan(upload.id);
    if (!virus_ok)
    {
      const body = `Malware check Failed. Upload Aborted.`;
      throw {status_code: 403, body};
    }
    else
    {
      /* Store in database */
      uploadDirectoryAdd(upload.id, upload.metadata.filename); // no await.
    }

    // We have to return the (modified) response.
    return res;
  }
})

uploadApp.all('*', server.handle.bind(server))
app.use('/files', uploadApp);

app.get('/filelist', (req, res) =>
{
  res.send(JSON.stringify(uploadDirectory));
});

app.use(express.static('htdocs/'))


app.listen(port, host, () =>
{
  console.log(`[${new Date().toLocaleTimeString()}] server listening at http://${host}:${port}`);
});
