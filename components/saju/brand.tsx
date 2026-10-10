import Image from 'next/image';

/** The original Loop L asset shared with lucianlabs.dev. */
export function Brand() {
  return <>
    <Image className="brand-mark" src="/lucianlabs-logo.svg" alt="" width={42} height={42} unoptimized />
    <span>사주랩<small>by LUCIAN LABS</small></span>
  </>;
}
