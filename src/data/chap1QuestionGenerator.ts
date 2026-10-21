import { Question } from '../types';

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function simplifyFrac(a: number, b: number): { a: number; b: number } {
  let num = a;
  let den = b;
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  return { a: num / g, b: den / g };
}

function formatFrac(a: number, b: number): string {
  const f = simplifyFrac(a, b);
  if (f.b === 1) return f.a.toString();
  return `\\dfrac{${f.a}}{${f.b}}`;
}

function makeUniqueOptions(correct: string, distractors: string[]): string[] {
  const list: string[] = [correct];
  for (const d of distractors) {
    if (d && !list.includes(d)) {
      list.push(d);
    }
  }
  return shuffle(list.slice(0, 4));
}

export function generateAllChap1Questions(): Question[] {
  const questions: Question[] = [];
  for (let i = 1; i <= 10; i++) {
    questions.push(generateChap1QuestionForStage(i));
  }
  return questions;
}

export function generateChap1QuestionForStage(n: number): Question {
  let tag = 'Đại số 7';
  let emoji = '🏛️';
  let prompt = '';
  let correct = '';
  let distractors: string[] = [];

  switch (n) {
    case 1: {
      tag = 'Giá trị tuyệt đối';
      emoji = '🔍';
      const b = rand(2, 9);
      let a = rand(-15, 15);
      while (a === 0 || Math.abs(a) === b) a = rand(-15, 15);
      const absA = Math.abs(a);

      prompt = `Tính giá trị tuyệt đối của số hữu tỉ $x = \\dfrac{${a}}{${b}}$:`;
      correct = `$|x| = \\dfrac{${absA}}{${b}}$`;
      distractors = [
        `$|x| = -\\dfrac{${absA}}{${b}}$`,
        `$|x| = -\\dfrac{${b}}{${absA}}$`,
        `$|x| = \\dfrac{${b}}{${absA}}$`,
      ];
      break;
    }

    case 2: {
      tag = 'Số đối của số thực';
      emoji = '☯';
      const type = rand(1, 3);
      if (type === 1) {
        let val = rand(-25, 25);
        while (val === 0) val = rand(-25, 25);
        prompt = `Tìm số đối của số thực $x = ${val}$:`;
        correct = `$${-val}$`;
        const diff = -val > 0 ? -val + 5 : -val - 5;
        distractors = [`$${val}$`, `$${diff}$`, `$\\dfrac{1}{${Math.abs(val)}}$`];
      } else if (type === 2) {
        const b = rand(2, 7);
        let a = rand(-11, 11);
        while (a === 0 || Math.abs(a) === b) a = rand(-11, 11);
        prompt = `Tìm số đối của số thực $x = \\dfrac{${a}}{${b}}$:`;
        correct = `$${formatFrac(-a, b)}$`;
        distractors = [
          `$${formatFrac(a, b)}$`,
          `$${formatFrac(b, Math.abs(a))}$`,
          `$${formatFrac(-b, Math.abs(a))}$`,
        ];
      } else {
        const k = rand(2, 19);
        prompt = `Tìm số đối của số thực $x = \\sqrt{${k}}$:`;
        correct = `$-\\sqrt{${k}}$`;
        distractors = [
          `$\\sqrt{${k}}$`,
          `$\\dfrac{1}{\\sqrt{${k}}}$`,
          `$-${k}$`,
        ];
      }
      break;
    }

    case 3: {
      tag = 'Căn bậc hai số học';
      emoji = '⚡';
      const r = rand(2, 25);
      const x = r * r;
      prompt = `Tìm căn bậc hai số học của $x = ${x}$:`;
      correct = `$\\sqrt{${x}} = ${r}$`;
      distractors = [
        `$\\sqrt{${x}} = -${r}$`,
        `$\\sqrt{${x}} = \\pm ${r}$`,
        `$\\sqrt{${x}} = ${r + 2}$`,
      ];
      break;
    }

    case 4: {
      tag = 'So sánh số thực';
      emoji = '⚖️';
      const b = rand(3, 9);
      const diffArr = [-5, -3, -2, 2, 3, 5];
      const diff = diffArr[rand(0, diffArr.length - 1)];
      let aRad = b * b + diff;
      if (aRad < 2) aRad = b * b + 2;
      const realValA = Math.sqrt(aRad);
      const relation = realValA > b ? '>' : '<';
      prompt = `So sánh hai số thực $a = \\sqrt{${aRad}}$ và $b = ${b}$:`;
      correct = `$\\sqrt{${aRad}} ${relation} ${b}$`;
      const altRel = relation === '>' ? '<' : '>';
      distractors = [
        `$\\sqrt{${aRad}} ${altRel} ${b}$`,
        `$\\sqrt{${aRad}} = ${b}$`,
        `Không so sánh được`,
      ];
      break;
    }

    case 5: {
      tag = 'Tổng/Hiệu số hữu tỉ';
      emoji = '🧮';
      const den = rand(2, 8);
      let num1 = rand(-7, 7);
      while (num1 === 0) num1 = rand(-7, 7);
      let num2 = rand(-7, 7);
      while (num2 === 0) num2 = rand(-7, 7);
      const isAdd = rand(0, 1) === 1;
      const resNum = isAdd ? num1 + num2 : num1 - num2;
      const opStr = isAdd ? '+' : '-';
      prompt = `Thực hiện phép tính: $${formatFrac(num1, den)} ${opStr} ${formatFrac(num2, den)}$`;
      correct = `$${formatFrac(resNum, den)}$`;
      distractors = [
        `$${formatFrac(resNum + 2, den)}$`,
        `$${formatFrac(resNum - 2, den)}$`,
        `$${formatFrac(num1 + num2, den * 2)}$`,
      ];
      break;
    }

    case 6: {
      tag = 'Tích/Thương số hữu tỉ';
      emoji = '✖️';
      const a1 = rand(1, 5);
      const b1 = rand(2, 6);
      const a2 = rand(1, 5);
      const b2 = rand(2, 6);
      const isMul = rand(0, 1) === 1;
      if (isMul) {
        prompt = `Thực hiện phép tính: $${formatFrac(a1, b1)} \\cdot ${formatFrac(a2, b2)}$`;
        correct = `$${formatFrac(a1 * a2, b1 * b2)}$`;
        distractors = [
          `$${formatFrac(a1 * b2, b1 * a2)}$`,
          `$${formatFrac(a1 + a2, b1 + b2)}$`,
          `$${formatFrac(a1 * a2, b1 + b2)}$`,
        ];
      } else {
        prompt = `Thực hiện phép tính: $${formatFrac(a1, b1)} : ${formatFrac(a2, b2)}$`;
        correct = `$${formatFrac(a1 * b2, b1 * a2)}$`;
        distractors = [
          `$${formatFrac(a1 * a2, b1 * b2)}$`,
          `$${formatFrac(a1 * b2, b1 + b2)}$`,
          `$${formatFrac(b1 * a2, a1 * b2)}$`,
        ];
      }
      break;
    }

    case 7: {
      tag = 'Lũy thừa của lũy thừa';
      emoji = '🚀';
      const baseArr = ['a', 'x', '2', '3', '\\left(\\dfrac{1}{2}\\right)'];
      const base = baseArr[rand(0, baseArr.length - 1)];
      const m = rand(2, 5);
      const nPow = rand(2, 4);
      const correctPow = m * nPow;
      const isFractionBase = base.includes('dfrac');
      const openOuter = isFractionBase ? '\\left[' : '\\left(';
      const closeOuter = isFractionBase ? '\\right]' : '\\right)';
      prompt = `Rút gọn biểu thức lũy thừa: $${openOuter} ${base}^{${m}} ${closeOuter}^{${nPow}}$:`;
      correct = `$${base}^{${correctPow}}$`;
      distractors = [
        `$${base}^{${m + nPow}}$`,
        `$${base}^{${m * m}}$`,
        `$${base}^{${correctPow + 2}}$`,
      ];
      break;
    }

    case 8: {
      tag = 'Tìm x hữu tỉ';
      emoji = '🧩';
      const a = rand(2, 5);
      const bNum = rand(1, 5);
      const bDen = rand(2, 5);
      let xNum = rand(-4, 4);
      while (xNum === 0) xNum = rand(-4, 4);
      const xDen = rand(2, 5);
      const cNum = a * xNum * bDen + bNum * xDen;
      const cDen = xDen * bDen;
      prompt = `Tìm số hữu tỉ $x$, biết: $${a}x + ${formatFrac(bNum, bDen)} = ${formatFrac(cNum, cDen)}$`;
      correct = `$x = ${formatFrac(xNum, xDen)}$`;
      distractors = [
        `$x = ${formatFrac(-xNum, xDen)}$`,
        `$x = ${formatFrac(xDen, xNum)}$`,
        `$x = ${formatFrac(xNum + 1, xDen)}$`,
      ];
      break;
    }

    case 9: {
      tag = 'So sánh giá trị tuyệt đối';
      emoji = '🎯';
      let aNum = rand(-9, 9);
      while (aNum === 0) aNum = rand(-9, 9);
      const aDen = rand(2, 6);
      const bDen = rand(2, 6);
      let bNum = rand(-9, 9);
      while (bNum === 0 || Math.abs(aNum * bDen) === Math.abs(bNum * aDen)) {
        bNum = rand(-9, 9);
      }
      prompt = `Cho hai số $a = ${formatFrac(aNum, aDen)}$ và $b = ${formatFrac(bNum, bDen)}$. Hãy so sánh hai giá trị tuyệt đối $|a|$ và $|b|$:`;

      const absA = Math.abs(aNum / aDen);
      const absB = Math.abs(bNum / bDen);
      const rel = absA > absB ? '>' : '<';
      const altRel = rel === '>' ? '<' : '>';

      correct = `$|a| ${rel} |b|$`;
      distractors = [
        `$|a| ${altRel} |b|$`,
        `$|a| = |b|$`,
        `Không so sánh được`,
      ];
      break;
    }

    case 10: {
      tag = 'Ứng dụng thực tế';
      emoji = '🚪';
      const r = rand(32, 99);
      const S = r * r;
      const P = 4 * r;
      prompt = `Một hình chữ nhật đặc biệt (hình vuông) có diện tích $S = ${S}\\text{ m}^2$. Tính chu vi $P$ của hình đó:`;
      correct = `$P = ${P}\\text{ m}$`;
      distractors = [
        `$P = ${r * 2}\\text{ m}$`,
        `$P = ${P + 8}\\text{ m}$`,
        `$P = ${P - 8}\\text{ m}$`,
      ];
      break;
    }
  }

  const options = makeUniqueOptions(correct, distractors);
  const correctIndex = options.indexOf(correct);

  return {
    id: n,
    stage: n,
    tag,
    emoji,
    prompt,
    options,
    correctIndex,
    correctAnswerText: correct,
  };
}
