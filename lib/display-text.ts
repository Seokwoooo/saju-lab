/** Normalize display punctuation without changing evidence IDs or calculation values. */
export function cleanDisplayText(text:string):string {
  return text.replace(/\s*[·ㆍ・]\s*/g, ', ');
}
