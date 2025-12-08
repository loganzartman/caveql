import { decode as decode2048, encode as encode2048 } from "base2048";
import { impossible } from "./impossible";

export type PackMethod = "base64-deflate" | "base2048-deflate";

export async function packString(
  str: string,
  method: PackMethod,
): Promise<string> {
  const data = new TextEncoder().encode(str);
  switch (method) {
    case "base64-deflate":
      return `a${btoa(String.fromCharCode(...(await compressBinary(data)))).replaceAll("=", "")}`;
    case "base2048-deflate":
      return `b${encode2048(await compressBinary(data))}`;
    default:
      impossible(method);
  }
}

export async function unpackString(packed: string): Promise<string> {
  if (packed.length === 0) {
    return "";
  }

  const code = packed[0];
  const packedStr = packed.substring(1);
  let data: Uint8Array<ArrayBuffer>;

  switch (code) {
    case "a":
      data = await decompressBinary(
        Uint8Array.from(atob(packedStr), (c) => c.charCodeAt(0)),
      );
      break;
    case "b":
      data = await decompressBinary(
        decode2048(packedStr) as Uint8Array<ArrayBuffer>,
      );
      break;
    default:
      throw new Error("Unsupported format code");
  }

  return new TextDecoder().decode(data);
}

export async function compressBinary(
  data: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
  const compressor = new CompressionStream("deflate-raw");
  const compressedStream = new Blob([data]).stream().pipeThrough(compressor);
  const blob = await new Response(compressedStream).blob();
  return new Uint8Array(await blob.arrayBuffer());
}

export async function decompressBinary(
  data: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
  const decompressor = new DecompressionStream("deflate-raw");
  const decompressedStream = new Blob([data])
    .stream()
    .pipeThrough(decompressor);
  const blob = await new Response(decompressedStream).blob();
  return new Uint8Array(await blob.arrayBuffer());
}
