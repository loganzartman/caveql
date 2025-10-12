import { decode, encode } from "base65536";

export async function packString(str: string): Promise<string> {
  return `a${await packBinary(new TextEncoder().encode(str))}`;
}

export async function unpackString(packed: string): Promise<string> {
  const code = packed[0];
  if (code !== "a") {
    throw new Error("Unsupported format code");
  }
  return new TextDecoder().decode(await unpackBinary(packed.substring(1)));
}

export async function packBinary(
  data: Uint8Array<ArrayBuffer>,
): Promise<string> {
  const compressor = new CompressionStream("deflate-raw");
  const blob = await new Response(
    new Blob([data]).stream().pipeThrough(compressor),
  ).blob();
  const compressed = new Uint8Array(await blob.arrayBuffer());
  return encode(compressed);
}

export async function unpackBinary(
  packed: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const data = decode(packed) as Uint8Array<ArrayBuffer>;
  const decompressor = new DecompressionStream("deflate-raw");
  const blob = await new Response(
    new Blob([data]).stream().pipeThrough(decompressor),
  ).blob();
  return new Uint8Array(await blob.arrayBuffer());
}
