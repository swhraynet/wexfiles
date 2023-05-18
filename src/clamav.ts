import { fromStreamReader } from "https://deno.land/std@0.74.0/io/mod.ts";
//import { readerFromStreamReader } from "https://deno.land/std@0.187.0/streams/reader_from_stream_reader.ts";

const CmdEncoder = new TextEncoder();
const CmdDecoder = new TextDecoder();

export const commands = {
  _: CmdEncoder.encode('\n'),
  ping: CmdEncoder.encode('nPING'),
  scan: CmdEncoder.encode('nSCAN '),
  stats: CmdEncoder.encode('nSTATS'),
  reload: CmdEncoder.encode('nRELOAD'),
  version: CmdEncoder.encode('nVERSION'),
  shutdown: CmdEncoder.encode('nSHUTDOWN'),
  contscan: CmdEncoder.encode('nCONTSCAN '),
  instream: CmdEncoder.encode('nINSTREAM\n'),
  multiscan: CmdEncoder.encode('nMULTISCAN '),
  allmatchscan: CmdEncoder.encode('nALLMATCHSCAN '),
}

export default class ClamAV {
  constructor({ port, host }) {
    this.port = port;
    this.host = host;
  }

  async ping() {
    return CmdDecoder.decode(await this.request(commands.ping));
  }

  async stats() {
    return CmdDecoder.decode(await this.request(commands.stats));
  }

  async reload() {
    return CmdDecoder.decode(await this.request(commands.reload));
  }

  async version() {
    return CmdDecoder.decode(await this.request(commands.version));
  }

  async contscan(path) {
    return CmdDecoder.decode(await this.request(commands.contscan, CmdEncoder.encode(path)));
  }

  async multiscan(path) {
    return CmdDecoder.decode(await this.request(commands.multiscan, CmdEncoder.encode(path)));
  }

  async allmatchscan(path) {
    return CmdDecoder.decode(await this.request(commands.allmatchscan, CmdEncoder.encode(path)));
  }

  async shutdown() {
    const res = await this.request(commands.shutdown);

    if (0 === res.length) return !!1;
    else throw CmdDecoder.decode(res);
  }

  async scan(body) {
    if ('string' === typeof body) {
      return CmdDecoder.decode(await this.request(commands.scan, CmdEncoder.encode(body)));
    }

    else if (ArrayBuffer.isView(body) & !(body instanceof Uint8Array)) body = new Uint8Array(body.buffer);
    else if (body instanceof ArrayBuffer || body instanceof SharedArrayBuffer) body = new Uint8Array(body);

    const { readable, writable } = new ChunksStream();
    const res = this.request(commands.instream, readable);
    if (body instanceof ReadableStream) await body.pipeTo(writable);

    else {
      const w = writable.getWriter();
      if (body instanceof Uint8Array) await w.write(body);
      else for await (const chunk of Deno.iter(body)) await w.write(chunk);

      await w.close();
    }

    return CmdDecoder.decode(await res);
  }


  async request(cmd, body) {
    const con = await Deno.connect({
      port: this.port,
      transport: 'tcp',
      hostname: this.host,
    }).catch(() => Promise.reject(new Error(`clamd is not running on ${this.host}:${this.port}`)));

    await con.write(cmd);

    if (body) {
      if (body instanceof Uint8Array) await Deno.writeAll(con, body);
      else await Deno.copy(body instanceof ReadableStream ? fromStreamReader(body.getReader()) : body, con);
    }

    con.write(commands._);
    return (await Deno.readAll(con)).subarray(0, -1);
  }
}

class ChunksStream extends TransformStream {
  static transformer = {
    flush: ChunksStream.flush,
    transform: ChunksStream.transform,
  };

  constructor() {
    super(ChunksStream.transformer);
  }

  static flush(controller) {
    controller.enqueue(new Uint8Array(4));
  }

  static transform(chunk, controller) {
    const size = new Uint8Array(4);
    new DataView(size.buffer).setUint32(0, chunk.length, false);

    controller.enqueue(size);
    controller.enqueue(chunk);
  }
}
