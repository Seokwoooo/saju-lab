import { ELEMENTS, ELEMENT_LABELS } from './contracts';
import type { Compatibility, Element, Reading, SajuChart } from './contracts';
import { SHARE_HOST } from './site-config';

export const CARD_TYPES = [
  { id: 'headline', label: '나를 닮은 한 문장', short: '한 문장', note: '나의 작은 소개서' },
  { id: 'balance', label: '오행 밸런스', short: '밸런스', note: '다섯 빛깔의 나' },
  { id: 'love', label: '연애 스타일', short: '연애', note: '마음을 나누는 방식' },
  { id: 'year', label: '올해의 흐름', short: '올해', note: '이번 계절의 힌트' },
  { id: 'career', label: '일과 재능', short: '일·재능', note: '내가 빛나는 자리' },
  { id: 'compatibility', label: '우리의 궁합', short: '궁합', note: '함께 자라는 두 사람' },
] as const;
export type CardType = (typeof CARD_TYPES)[number]['id'];
export type CardFormat = 'portrait' | 'story';
export type CardTheme = 'cream' | 'lavender' | 'peach';
export interface CardContent {
  type: CardType;
  headline: string;
  body: string;
  tip: string;
  nickname?: string;
  elements: Element[];
  percentages: Record<Element, number>;
  year: number;
  footnote: string;
  source: 'local' | 'ai';
}

/** This allowlist is the whole export boundary: never spread a chart or birth input. */
export function createCardContent(options: {
  type: CardType; chart: SajuChart; reading: Reading; compatibility?: Compatibility;
  nickname?: string; showNickname?: boolean; compatibilityUncertain?: boolean;
}): CardContent {
  const { type, chart, reading, compatibility } = options;
  if (type === 'compatibility' && !compatibility) throw new Error('먼저 두 사람의 궁합을 계산해 주세요.');
  const section = type === 'love' ? reading.sections.love : type === 'career' ? reading.sections.career : type === 'year' ? reading.sections.year : reading.sections.personality;
  const uncertain = [!chart.timeKnown ? '시간 미상' : '', chart.boundaryUncertain ? '절기·시각 경계의 불확실성' : '', type === 'compatibility' && options.compatibilityUncertain ? '상대 정보의 불확실성' : ''].filter(Boolean);
  return {
    type,
    headline: cleanText(type === 'compatibility' ? compatibility!.title : type === 'headline' ? reading.headline : type === 'balance' ? '다섯 빛깔로 이루어진 나' : section.title, 160),
    body: selectCardExcerpt(type === 'compatibility' ? compatibility!.summary : type === 'headline' ? reading.intro : type === 'balance' ? '많고 적음은 좋고 나쁨이 아니에요. 나의 서로 다른 결을 만나 보세요.' : section.body, type === 'headline' ? 72 : type === 'compatibility' ? 65 : type === 'year' ? 110 : 90),
    tip: selectCardExcerpt(type === 'compatibility' ? compatibility!.advice : section.tip, 70),
    ...(options.showNickname && options.nickname?.trim() ? { nickname: cleanText(options.nickname, 20) } : {}),
    elements: type === 'compatibility' ? [...compatibility!.elements] : [chart.dayElement],
    percentages: getElementPercentages(chart.elementCounts),
    year: chart.profile.analysisYear,
    footnote: `${uncertain.length ? `${uncertain.join(' · ')} / ` : ''}전통 해석을 바탕으로 한 재미와 자기성찰용 콘텐츠`,
    source: type === 'compatibility' ? 'local' : reading.source,
  };
}

function cleanText(text: string, limit: number) {
  return Array.from(text.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, limit).join('');
}
/** Prefer complete source sentences; do not invent an AI or static summary. */
export function selectCardExcerpt(text: string, maxCharacters: number): string {
  const clean = cleanText(text, 1200);
  const sentences = clean.match(/[^.!?。！？]+[.!?。！？]+(?:[”’"']+)?|[^.!?。！？]+$/g) || [];
  let result = '';
  for (const sentence of sentences.slice(0, 2)) {
    const next = `${result}${result ? ' ' : ''}${sentence.trim()}`;
    if (Array.from(next).length > maxCharacters) break;
    result = next;
  }
  if (result) return result;
  if (Array.from(clean).length <= maxCharacters) return clean;
  const clipped = Array.from(clean).slice(0, maxCharacters - 1).join('');
  const lastSpace = clipped.lastIndexOf(' ');
  return `${(lastSpace > maxCharacters * .55 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

export interface CardTextBox { x: number; y: number; width: number; height: number; fontSize: number; minFontSize: number; maxLines: number; centered?: boolean }
export function getCardTextLayout(type: CardType, format: CardFormat, hasNickname = false): { title: CardTextBox; body: CardTextBox; tip?: CardTextBox } {
  const extra = getCardDimensions(format).height - 1350;
  const titleY = hasNickname ? 212 : 180;
  const box = (x: number, y: number, width: number, height: number, fontSize: number, maxLines: number, centered = true, minFontSize = fontSize - 8): CardTextBox => ({ x, y, width, height, fontSize, minFontSize, maxLines, centered });
  switch (type) {
    case 'headline': return { title: box(145, titleY, 790, 250, 65, 3, true, 44), body: box(200, 987 + extra * .52, 680, 125 + extra * .1, 29, 3, true, 25) };
    case 'balance': return { title: box(115, titleY, 850, 155, 57, 2, true, 41), body: box(125, 1034 + extra * .55, 830, 122, 27, 3, true, 24) };
    case 'love': return { title: box(185, 314, 710, 241, 56, 3, true, 40), body: box(176, 947 + extra * .5, 728, 175 + extra * .1, 29, 4, true, 25) };
    case 'year': return { title: box(116, 421 + extra * .12, 800, 235, 56, 3, false, 40), body: box(119, 738 + extra * .27, 468, 262 + extra * .1, 28, 6, false, 24), tip: box(117, 1045 + extra * .56, 810, 105 + extra * .1, 28, 3, false, 24) };
    case 'career': return { title: box(116, 336 + extra * .08, 430, 295, 56, 4, false, 39), body: box(130, 1035 + extra * .52, 820, 118 + extra * .1, 29, 3, true, 25) };
    case 'compatibility': return { title: box(126, 300, 827, 240, 59, 3, true, 42), body: box(132, 967 + extra * .45, 816, 99 + extra * .1, 30, 2, true, 26), tip: box(145, 1090 + extra * .55, 790, 64 + extra * .1, 25, 2, true, 22) };
  }
}
export function getCardDimensions(format: CardFormat) { return { width: 1080, height: format === 'story' ? 1920 : 1350 }; }
export function getElementPercentages(counts: Record<Element, number>): Record<Element, number> {
  const total = ELEMENTS.reduce((sum, e) => sum + Math.max(0, counts[e]), 0);
  const values = ELEMENTS.map(e => total ? Math.max(0, counts[e]) / total * 100 : 0);
  const rounded = values.map(Math.floor);
  let remaining = total ? 100 - rounded.reduce((a, b) => a + b, 0) : 0;
  const order = values.map((value, index) => ({ index, fraction: value - rounded[index] })).sort((a, b) => b.fraction - a.fraction);
  for (const { index } of order) { if (remaining-- <= 0) break; rounded[index] += 1; }
  return Object.fromEntries(ELEMENTS.map((element, index) => [element, rounded[index]])) as Record<Element, number>;
}

/** Measure every line in the export font; use an ellipsis when copy exceeds its box. */
export function fitCardText(text: string, measure: (text: string) => number, maxWidth: number, maxLines: number): string[] {
  if (!text || maxWidth <= 0 || maxLines <= 0) return [];
  const characters = Array.from(text.replace(/\s+/g, ' ').trim());
  const lines: string[] = [];
  let current = '';
  for (let i = 0; i < characters.length; i++) {
    const next = characters[i];
    if (current && measure(current + next) > maxWidth) {
      lines.push(current.trim());
      current = next.trimStart();
      if (lines.length === maxLines) {
        let last = lines[maxLines - 1];
        while (last && measure(`${last}…`) > maxWidth) last = Array.from(last).slice(0, -1).join('');
        lines[maxLines - 1] = `${last.trimEnd()}…`;
        return lines;
      }
    } else current += next;
  }
  if (current) lines.push(current.trim());
  return lines;
}

export const ELEMENT_COLORS: Record<Element, string> = { wood: '#b8d8b8', fire: '#f9b194', earth: '#e8cc89', metal: '#d2c6eb', water: '#b9d8e9' };
const INK = '#3b483e';
function path(ctx: CanvasRenderingContext2D, data: string, fill: string, stroke = INK, width = 2.6) {
  const shape = new Path2D(data); ctx.fillStyle = fill; ctx.fill(shape); ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(shape);
}
function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
}

/** Original vector friends, shared visual vocabulary with the locally hosted SVGs. */
export function drawElementCharacter(ctx: CanvasRenderingContext2D, element: Element, x: number, y: number, size: number, rotation = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(size / 200, size / 200);
  ellipse(ctx, 100, 183, 61, 9, '#3b483e12');
  const color = ELEMENT_COLORS[element];
  if (element === 'wood') {
    path(ctx, 'M96 58C78 41 45 47 50 68C54 90 80 93 97 78M104 62C110 36 143 34 153 50C160 69 130 84 104 75', '#b8d8b8');
    path(ctx, 'M100 48L100 99', 'transparent', INK, 3);
    path(ctx, 'M48 100Q100 70 152 100L143 157Q133 185 100 185Q66 185 57 157Z', '#c3daba');
    path(ctx, 'M44 104Q100 87 156 104L153 119Q100 104 47 119Z', '#e5edd8');
    path(ctx, 'M60 145Q37 133 33 146M140 145Q164 128 170 143', 'transparent');
  } else if (element === 'fire') {
    path(ctx, 'M98 23C109 56 142 64 143 97C150 88 156 77 157 64C181 93 183 116 173 144C161 177 126 187 101 185C61 183 33 158 37 122C41 94 69 80 69 54C77 60 81 73 82 83C100 68 104 47 98 23Z', color);
    path(ctx, 'M75 161Q99 123 127 162Q123 181 99 183Q79 181 75 161Z', '#ffe6ae', INK, 2);
    path(ctx, 'M43 125L26 135M163 126L178 132', 'transparent');
  } else if (element === 'earth') {
    path(ctx, 'M42 142C34 103 63 79 94 77C130 68 170 101 161 145Q155 184 100 185Q48 182 42 142Z', color);
    path(ctx, 'M72 83Q60 48 85 56L98 78Q102 38 124 48Q144 61 110 81', '#bbd5b5');
    path(ctx, 'M53 147L30 147M152 146L175 144', 'transparent');
    ellipse(ctx, 64, 165, 7, 3, '#cbaa68'); ellipse(ctx, 138, 158, 6, 3, '#cbaa68');
  } else if (element === 'metal') {
    path(ctx, 'M100 34Q106 34 111 47L126 76L159 78Q182 80 166 99L144 123L150 156Q154 177 135 169L100 153L68 169Q46 181 51 156L57 123L33 100Q18 80 43 78L76 76L90 45Q96 34 100 34Z', color);
    path(ctx, 'M48 129L30 137M150 127L170 139', 'transparent');
    ellipse(ctx, 76, 173, 13, 5, '#d2c6eb'); ellipse(ctx, 125, 173, 13, 5, '#d2c6eb');
  } else {
    path(ctx, 'M99 29C83 60 45 89 40 122C35 160 60 183 100 185C145 185 171 160 164 122C157 86 121 59 99 29Z', color);
    path(ctx, 'M59 105Q55 121 58 132', 'transparent', '#edf6fb', 8);
    path(ctx, 'M45 143L27 145M160 141L177 145', 'transparent');
  }
  const eyeY = element === 'wood' ? 139 : element === 'metal' ? 108 : 125;
  ellipse(ctx, 81, eyeY, 3.5, 5, INK); ellipse(ctx, 119, eyeY, 3.5, 5, INK);
  ctx.beginPath(); ctx.moveTo(94, eyeY + 8); ctx.quadraticCurveTo(100, eyeY + 15, 107, eyeY + 8); ctx.strokeStyle = INK; ctx.lineWidth = 2.3; ctx.stroke();
  ellipse(ctx, 69, eyeY + 10, 9, 4.7, '#eea39488'); ellipse(ctx, 131, eyeY + 10, 9, 4.7, '#eea39488');
  ctx.restore();
}

function textBlock(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, size: number, maxLines: number, options: { serif?: boolean; center?: boolean; color?: string; weight?: number } = {}) {
  ctx.fillStyle = options.color || INK; ctx.font = `${options.weight || 400} ${size}px "${options.serif ? 'Saju Serif' : 'Saju Sans'}"`;
  ctx.textAlign = options.center ? 'center' : 'left';
  const lines = fitCardText(text, value => ctx.measureText(value).width, width, maxLines);
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * size * 1.48));
  return lines.length * size * 1.48;
}
function boundedText(ctx: CanvasRenderingContext2D, text: string, box: CardTextBox, serif = false) {
  ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.width, box.height); ctx.clip();
  let size = box.fontSize;
  let lines: string[] = [];
  let ascent = 0; let descent = 0;
  for (;;) {
    ctx.font = `400 ${size}px "${serif ? 'Saju Serif' : 'Saju Sans'}"`;
    lines = fitCardText(text, value => ctx.measureText(value).width, box.width, box.maxLines);
    const metrics = lines.map(value => ctx.measureText(value));
    ascent = Math.max(size * .8, ...metrics.map(metric => metric.actualBoundingBoxAscent));
    descent = Math.max(size * .2, ...metrics.map(metric => metric.actualBoundingBoxDescent));
    const fits = !lines.at(-1)?.endsWith('…') && ascent + descent + Math.max(0, lines.length - 1) * size * 1.4 <= box.height;
    if (fits || size <= box.minFontSize) break;
    size = Math.max(box.minFontSize, size - 1);
  }
  ctx.fillStyle = INK; ctx.textAlign = box.centered ? 'center' : 'left';
  const x = box.centered ? box.x + box.width / 2 : box.x;
  lines.forEach((value, index) => ctx.fillText(value, x, box.y + ascent + index * size * 1.4));
  ctx.restore();
}
function line(ctx: CanvasRenderingContext2D, x: number, y: number, x2: number, y2: number, color = '#3b483e33') {
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
}
function flower(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save(); ctx.translate(x, y);
  for (let i = 0; i < 5; i++) { ctx.rotate(Math.PI * 2 / 5); ellipse(ctx, 0, -size * .55, size * .3, size * .5, color); }
  ellipse(ctx, 0, 0, size * .3, size * .3, '#f8e5ab'); ctx.restore();
}
function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, border?: string) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = 2; ctx.stroke(); }
}

export async function renderShareCard(content: CardContent, format: CardFormat, theme: CardTheme): Promise<Blob> {
  if (typeof document === 'undefined') throw new Error('이미지 저장은 브라우저에서 사용할 수 있어요.');
  const loaded = await Promise.all([document.fonts.load('400 64px "Saju Serif"', '한글'), document.fonts.load('500 32px "Saju Sans"', '한글')]);
  await document.fonts.ready;
  if (loaded.some(fonts => fonts.length === 0)) throw new Error('카드 글꼴을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
  const { width, height } = getCardDimensions(format);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('이 브라우저에서 이미지 저장을 지원하지 않아요.');
  const backgrounds = { cream: '#faf6e9', lavender: '#f0ebf7', peach: '#fceee7' };
  ctx.fillStyle = backgrounds[theme]; ctx.fillRect(0, 0, width, height);
  // Quiet paper flecks are fixed, so the preview and saved image stay identical.
  for (let i = 0; i < 900; i++) { ctx.fillStyle = i % 2 ? '#3b483e08' : '#ffffff77'; ctx.fillRect((i * 137) % width, (i * 233) % height, 1.8, 1.8); }
  const extra = height - 1350;
  ctx.strokeStyle = '#3b483e55'; ctx.lineWidth = 2; ctx.strokeRect(40, 40, 1000, height - 80);
  textBlock(ctx, 'SAJU LAB', 84, 116, 500, 25, 1, { weight: 600 });
  const label = CARD_TYPES.find(type => type.id === content.type)!;
  // The small editorial label is right-aligned, independent of title layout.
  ctx.textAlign = 'right'; ctx.font = '400 22px "Saju Sans"'; ctx.fillStyle = INK; ctx.fillText(label.note, 992, 116);
  line(ctx, 84, 153, 996, 153);
  if (content.nickname) textBlock(ctx, `${content.nickname}의 작은 기록`, 540, 193, 850, 24, 1, { center: true });
  const layout = getCardTextLayout(content.type, format, !!content.nickname);
  const mainElement = content.elements[0];
  if (content.type === 'headline') {
    flower(ctx, 154, 350 + extra * .18, 48, '#e4c0cc'); flower(ctx, 932, 625 + extra * .35, 35, '#c6d8c1');
    boundedText(ctx, content.headline, layout.title, true);
    drawElementCharacter(ctx, mainElement, 330, 490 + extra * .32, 420, -.04);
    rounded(ctx, 151, 965 + extra * .5, 778, 170 + extra * .15, 10, '#fffdf57a', '#3b483e25');
    boundedText(ctx, content.body, layout.body);
    textBlock(ctx, 'a little note about me', 540, 931 + extra * .48, 700, 25, 1, { center: true, serif: true });
  } else if (content.type === 'balance') {
    boundedText(ctx, content.headline, layout.title, true);
    const centerY = 597 + extra * .3;
    ctx.beginPath(); ctx.arc(540, centerY, 216, 0, Math.PI * 2); ctx.strokeStyle = '#3b483e1f'; ctx.lineWidth = 47; ctx.stroke();
    let start = -Math.PI / 2;
    for (const e of ELEMENTS) { const angle = content.percentages[e] / 100 * Math.PI * 2; if (angle) { ctx.beginPath(); ctx.arc(540, centerY, 216, start, start + angle); ctx.strokeStyle = ELEMENT_COLORS[e]; ctx.lineWidth = 47; ctx.stroke(); } start += angle; }
    drawElementCharacter(ctx, mainElement, 400, centerY - 138, 280);
    ELEMENTS.forEach((e, i) => {
      const x = 172 + i * 184; drawElementCharacter(ctx, e, x - 48, 860 + extra * .43, 96);
      textBlock(ctx, `${ELEMENT_LABELS[e]} ${content.percentages[e]}%`, x, 990 + extra * .43, 170, 25, 1, { center: true, weight: 500 });
    });
    boundedText(ctx, content.body, layout.body);
  } else if (content.type === 'love') {
    rounded(ctx, 87, 206, 906, height - 420, 190, '#f7dfe5', '#ba838333');
    textBlock(ctx, 'a letter from my heart', 540, 284, 800, 29, 1, { center: true, serif: true });
    flower(ctx, 219, 458 + extra * .17, 55, '#fff7e8'); flower(ctx, 862, 764 + extra * .37, 60, '#e0b2c4');
    boundedText(ctx, content.headline, layout.title, true);
    drawElementCharacter(ctx, mainElement, 361, 585 + extra * .27, 358, .05);
    boundedText(ctx, content.body, layout.body);
  } else if (content.type === 'year') {
    rounded(ctx, 83, 218, 914, 177, 8, '#dbe9e8');
    textBlock(ctx, String(content.year), 129, 354, 600, 113, 1, { serif: true });
    textBlock(ctx, 'MY NEXT CHAPTER', 750, 339, 410, 23, 1, { center: true, weight: 500 });
    boundedText(ctx, content.headline, layout.title, true);
    drawElementCharacter(ctx, mainElement, 654, 669 + extra * .27, 284, .07);
    flower(ctx, 927, 703 + extra * .27, 30, '#edcda1');
    boundedText(ctx, content.body, layout.body);
    line(ctx, 116, 1020 + extra * .52, 959, 1020 + extra * .52);
    boundedText(ctx, content.tip, layout.tip!);
  } else if (content.type === 'career') {
    textBlock(ctx, 'A PLACE TO BLOOM', 540, 256, 800, 28, 1, { center: true, weight: 500 });
    boundedText(ctx, content.headline, layout.title, true);
    const y = 880 + extra * .34;
    rounded(ctx, 146, y, 220, 120, 3, '#ead6bb'); rounded(ctx, 365, y - 75, 250, 195, 3, '#ebc4b5'); rounded(ctx, 614, y - 162, 320, 282, 3, '#d4d9bc');
    drawElementCharacter(ctx, mainElement, 650, 446 + extra * .22, 288, -.03);
    flower(ctx, 287, y - 60, 44, '#d5bddf');
    boundedText(ctx, content.body, layout.body);
  } else {
    textBlock(ctx, 'YOU + ME', 540, 249, 800, 30, 1, { center: true, weight: 500 });
    boundedText(ctx, content.headline, layout.title, true);
    ctx.beginPath(); ctx.ellipse(540, 827 + extra * .3, 344, 105, -.025, 0, Math.PI * 2); ctx.fillStyle = '#d8e4ca'; ctx.fill();
    drawElementCharacter(ctx, content.elements[0], 204, 570 + extra * .3, 330, -.09);
    drawElementCharacter(ctx, content.elements[1], 548, 570 + extra * .3, 330, .09);
    flower(ctx, 540, 600 + extra * .3, 45, '#e8bfcd');
    boundedText(ctx, content.body, layout.body, true);
    boundedText(ctx, content.tip, layout.tip!);
  }
  const footerY = height - 167;
  line(ctx, 84, footerY, 996, footerY);
  textBlock(ctx, `사주랩 · ${content.source === 'ai' ? 'AI 심화 풀이' : '기본 풀이'} · 나를 만나는 작은 연구소`, 84, footerY + 46, 900, 25, 1, { weight: 500 });
  textBlock(ctx, SHARE_HOST, 84, footerY + 85, 860, 19, 1);
  textBlock(ctx, content.footnote, 84, footerY + 119, 880, 16, 1, { color: '#586458' });
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('이미지를 만들지 못했어요. 다시 시도해 주세요.')), 'image/png'));
}
