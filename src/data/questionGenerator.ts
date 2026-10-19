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

function makeUniqueOptions(correct: string, distractors: string[]): string[] {
  const result: string[] = [correct];
  for (const d of distractors) {
    if (d && !result.includes(d)) {
      result.push(d);
    }
  }
  // Fill up to 4 if needed
  let counter = 1;
  while (result.length < 4) {
    const fallback = `${correct} (${counter})`;
    if (!result.includes(fallback)) result.push(fallback);
    counter++;
  }
  return shuffle(result.slice(0, 4));
}

export function generateAllQuestions(): Question[] {
  const questions: Question[] = [];

  for (let stage = 1; stage <= 10; stage++) {
    questions.push(generateQuestionForStage(stage));
  }

  return questions;
}

export function generateQuestionForStage(stage: number): Question {
  let tag = 'Hình học';
  let emoji = '📐';
  let prompt = '';
  let mathBox: string | undefined = undefined;
  let correct = '';
  let distractors: string[] = [];

  switch (stage) {
    case 1: {
      tag = 'Góc đối đỉnh';
      emoji = '⚔️';
      const deg = rand(25, 145);
      prompt = `Cho hai góc $\\widehat{xAy}$ và $\\widehat{zAt}$ là hai góc đối đỉnh. Biết $\\widehat{xAy} = ${deg}^\\circ$. Tìm số đo góc $\\widehat{zAt}$:`;
      correct = `$\\widehat{zAt} = ${deg}^\\circ$`;
      distractors = [
        `$\\widehat{zAt} = ${180 - deg}^\\circ$`,
        `$\\widehat{zAt} = ${Math.floor(deg / 2)}^\\circ$`,
        `$\\widehat{zAt} = ${deg < 90 ? deg + 20 : deg - 20}^\\circ$`,
      ];
      break;
    }

    case 2: {
      tag = 'Góc kề bù';
      emoji = '🔄';
      const deg = rand(20, 160);
      const ans = 180 - deg;
      prompt = `Cho $\\widehat{xAy}$ và $\\widehat{yAz}$ là hai góc kề bù. Biết $\\widehat{xAy} = ${deg}^\\circ$. Tính số đo của góc $\\widehat{yAz}$:`;
      correct = `$\\widehat{yAz} = ${ans}^\\circ$`;
      distractors = [
        `$\\widehat{yAz} = ${deg}^\\circ$`,
        `$\\widehat{yAz} = ${90 - Math.floor(deg / 3)}^\\circ$`,
        `$\\widehat{yAz} = ${ans > 25 ? ans - 15 : ans + 15}^\\circ$`,
      ];
      break;
    }

    case 3: {
      tag = 'So le trong';
      emoji = '🔀';
      const deg = rand(30, 150);
      prompt = `Cho hai đường thẳng song song $a // b$ bị cắt bởi một cát tuyến. Góc $\\widehat{A}$ và góc $\\widehat{B}$ là hai góc so le trong. Biết $\\widehat{A} = ${deg}^\\circ$, tìm số đo $\\widehat{B}$:`;
      correct = `$\\widehat{B} = ${deg}^\\circ$`;
      distractors = [
        `$\\widehat{B} = ${180 - deg}^\\circ$`,
        `$\\widehat{B} = ${90}^\\circ$`,
        `$\\widehat{B} = ${deg > 60 ? deg - 20 : deg + 20}^\\circ$`,
      ];
      break;
    }

    case 4: {
      tag = 'Đồng vị';
      emoji = '⬆️';
      const deg = rand(35, 145);
      prompt = `Cho hai đường thẳng $a // b$ cắt bởi đường thẳng $c$. Cho biết góc $\\widehat{A}_1$ và $\\widehat{B}_1$ là hai góc đồng vị. Nếu $\\widehat{A}_1 = ${deg}^\\circ$ thì số đo góc $\\widehat{B}_1$ là:`;
      correct = `$\\widehat{B}_1 = ${deg}^\\circ$`;
      distractors = [
        `$\\widehat{B}_1 = ${180 - deg}^\\circ$`,
        `$\\widehat{B}_1 = ${Math.floor(deg / 2)}^\\circ$`,
        `$\\widehat{B}_1 = ${deg > 40 ? deg - 15 : deg + 15}^\\circ$`,
      ];
      break;
    }

    case 5: {
      tag = 'Tia phân giác';
      emoji = '✂️';
      const half = rand(15, 75);
      const total = half * 2;
      prompt = `Cho góc $\\widehat{xAy} = ${total}^\\circ$ và tia $At$ là tia phân giác của góc $\\widehat{xAy}$. Số đo của góc $\\widehat{xAt}$ bằng:`;
      correct = `$\\widehat{xAt} = ${half}^\\circ$`;
      distractors = [
        `$\\widehat{xAt} = ${total}^\\circ$`,
        `$\\widehat{xAt} = ${180 - total}^\\circ$`,
        `$\\widehat{xAt} = ${half + 10}^\\circ$`,
      ];
      break;
    }

    case 6: {
      tag = 'Tổng ba góc tam giác';
      emoji = '🔺';
      const degB = rand(30, 75);
      const degC = rand(25, 150 - degB);
      const degA = 180 - degB - degC;
      prompt = `Cho $\\triangle ABC$ có $\\widehat{B} = ${degB}^\\circ$ và $\\widehat{C} = ${degC}^\\circ$. Số đo của góc $\\widehat{A}$ là:`;
      correct = `$\\widehat{A} = ${degA}^\\circ$`;
      distractors = [
        `$\\widehat{A} = ${degB + degC}^\\circ$`,
        `$\\widehat{A} = ${180 - degB}^\\circ$`,
        `$\\widehat{A} = ${degA + 15 > 180 ? degA - 20 : degA + 15}^\\circ$`,
      ];
      break;
    }

    case 7: {
      tag = 'Tam giác vuông';
      emoji = '📐';
      const degB = rand(20, 70);
      const degC = 90 - degB;
      prompt = `Cho $\\triangle ABC$ vuông tại $A$. Biết góc $\\widehat{B} = ${degB}^\\circ$. Số đo của góc nhọn $\\widehat{C}$ là:`;
      correct = `$\\widehat{C} = ${degC}^\\circ$`;
      distractors = [
        `$\\widehat{C} = ${180 - degB}^\\circ$`,
        `$\\widehat{C} = ${degB}^\\circ$`,
        `$\\widehat{C} = ${degC + 10}^\\circ$`,
      ];
      break;
    }

    case 8: {
      tag = 'Phân loại tam giác';
      emoji = '🔍';
      const typeChoice = rand(1, 3);
      let degB = 0;
      let degC = 0;
      let correctType = '';

      if (typeChoice === 1) {
        // Tam giác vuông
        degB = rand(25, 65);
        degC = 90 - degB;
        correctType = 'Tam giác vuông';
      } else if (typeChoice === 2) {
        // Tam giác tù
        degB = rand(20, 35);
        degC = rand(20, 40);
        // degA = 180 - degB - degC > 105
        correctType = 'Tam giác tù';
      } else {
        // Tam giác nhọn
        degB = rand(50, 70);
        degC = rand(50, 70);
        correctType = 'Tam giác nhọn';
      }

      prompt = `Cho $\\triangle ABC$ có số đo hai góc là $\\widehat{B} = ${degB}^\\circ$ và $\\widehat{C} = ${degC}^\\circ$. Hỏi $\\triangle ABC$ là loại tam giác nào?`;
      correct = correctType;
      distractors = ['Tam giác nhọn', 'Tam giác vuông', 'Tam giác tù', 'Tam giác đều'].filter(
        (t) => t !== correctType
      );
      break;
    }

    case 9: {
      tag = 'Tìm x trong tam giác';
      emoji = '🧮';
      const xVal = rand(25, 42);
      const a = rand(6, 18);
      const b = 180 - 3 * xVal - a;
      prompt = `Cho $\\triangle ABC$ có $\\widehat{A} = x$, $\\widehat{B} = x + ${a}^\\circ$, $\\widehat{C} = x + ${b}^\\circ$. Giá trị của $x$ là:`;
      correct = `$x = ${xVal}^\\circ$`;
      distractors = [
        `$x = ${xVal + 5}^\\circ$`,
        `$x = ${xVal - 5}^\\circ$`,
        `$x = ${xVal + 10}^\\circ$`,
      ];
      break;
    }

    case 10: {
      tag = 'Độ kiếp · Góc ngoài';
      emoji = '🌩️';
      const degB = rand(25, 55);
      const degC = rand(30, 75);
      const extA = degB + degC;
      prompt = `Cho $\\triangle ABC$ có $\\widehat{B} = ${degB}^\\circ$ và $\\widehat{C} = ${degC}^\\circ$. Số đo của góc ngoài tại đỉnh $A$ bằng:`;
      correct = `$${extA}^\\circ$`;
      distractors = [
        `$${180 - extA}^\\circ$`,
        `$${extA - 10}^\\circ$`,
        `$${180 - degB}^\\circ$`,
      ];
      break;
    }
  }

  const options = makeUniqueOptions(correct, distractors);
  const correctIndex = options.indexOf(correct);

  return {
    id: stage,
    stage,
    tag,
    emoji,
    prompt,
    mathBox,
    options,
    correctIndex,
    correctAnswerText: correct,
  };
}
