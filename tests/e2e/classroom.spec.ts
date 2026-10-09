import { test, expect, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import { generateQuestion } from '../../packages/question-bank/src/index';
async function register(
  page: Page,
  role: 'teacher' | 'student',
  username: string,
) {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Create a local account', exact: true })
    .click();
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page
    .getByLabel('Password · at least 12 characters')
    .fill('fictional-browser-password-42');
  await page
    .getByRole('combobox', { name: 'Role', exact: true })
    .selectOption(role);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Sign out', exact: true }),
  ).toBeVisible();
}
test('authenticated classroom publication, enrollment, photo, confirmed fraction work, teacher release, and login', async ({
  browser,
}) => {
  const teacherContext = await browser.newContext();
  const studentContext = await browser.newContext();
  const teacher = await teacherContext.newPage();
  const student = await studentContext.newPage();
  const suffix = crypto.randomUUID().slice(0, 8);
  const username = `student_${suffix}`;
  try {
    await register(teacher, 'teacher', `teacher_${suffix}`);
    await teacher
      .getByText('Create a classroom or publish an assignment', { exact: true })
      .click();
    await teacher
      .getByLabel('Classroom name', { exact: true })
      .fill('Browser verification studio');
    await teacher
      .getByRole('button', { name: 'Create classroom', exact: true })
      .click();
    const enrollment = teacher.locator('.enrollment');
    await expect(enrollment).toHaveText(/^[A-F0-9]{12}$/);
    const code = (await enrollment.innerText()).trim();
    await teacher
      .getByLabel('Title', { exact: true })
      .fill('Fraction reasoning review');
    await teacher
      .getByRole('combobox', { name: 'Skill', exact: true })
      .selectOption('fraction-addition');
    await teacher.getByRole('button', { name: 'Preview', exact: true }).click();
    const question = generateQuestion('fraction-addition', 42, 'intro');
    await expect(
      teacher.getByText(question.expression, { exact: true }),
    ).toBeVisible();
    await teacher
      .getByRole('button', { name: 'Publish assignment', exact: true })
      .click();
    await expect(
      teacher.getByText('Assignment published.', { exact: true }),
    ).toBeVisible();
    await register(student, 'student', username);
    await student.getByText('Join a classroom', { exact: true }).click();
    await student.getByLabel('12-character enrollment code').fill(code);
    await student
      .getByRole('button', { name: 'Join classroom', exact: true })
      .click();
    await student
      .getByRole('button', { name: /Fraction reasoning review/ })
      .click();
    // Controlled typeset fixture verifies capture/storage, not handwriting OCR accuracy.
    const photo = await sharp(
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="200"><rect width="100%" height="100%" fill="white"/><text x="30" y="100" font-size="32">${question.expression}</text></svg>`,
      ),
    )
      .png()
      .toBuffer();
    await student.getByLabel('Choose a photo').setInputFiles({
      name: 'controlled-typeset.png',
      mimeType: 'image/png',
      buffer: photo,
    });
    await student.getByRole('button', { name: 'Rotate 90°' }).click();
    await student
      .getByRole('button', { name: 'Save photo', exact: true })
      .click();
    await expect(student.getByText(/Photo saved privately/)).toBeVisible();
    for (const [i, line] of question.reference.entries()) {
      if (i > 0)
        await student
          .getByRole('button', { name: '+ Add a step', exact: true })
          .click();
      await student.getByLabel(`Step ${i + 1}`, { exact: true }).fill(line);
    }
    await student.getByRole('checkbox').check();
    await student
      .getByLabel('Step 1', { exact: true })
      .fill(question.expression + ' ');
    await expect(student.getByRole('checkbox')).not.toBeChecked();
    await student.getByRole('checkbox').check();
    await student
      .getByRole('button', { name: /Confirm & check steps/ })
      .click();
    await expect(
      student.getByText(/Your teacher will release feedback/),
    ).toBeVisible();
    await teacher.getByRole('button', { name: 'Refresh progress' }).click();
    await teacher
      .getByRole('button', { name: /Fraction reasoning review/ })
      .click();
    await expect(
      teacher.getByText('A COMPLETE, CONSISTENT SOLUTION'),
    ).toBeVisible();
    await expect(
      teacher.getByRole('img', { name: "Student's submitted mathematics" }),
    ).toBeVisible();
    await teacher.getByLabel('Teacher decision').selectOption('correct');
    await teacher
      .getByLabel('Review explanation')
      .fill('The common denominator and exact fraction sum are correct.');
    await teacher
      .getByRole('button', { name: 'Record review & release feedback' })
      .click();
    await expect(teacher.getByText('FINALIZED', { exact: true })).toBeVisible();
    await expect(teacher.locator('.events')).toContainText('feedback released');
    const replay = teacher.getByRole('slider', { name: /Replay position/ });
    await replay.fill('0');
    await expect(teacher.locator('.events li')).toHaveCount(0);
    expect(
      (
        await new AxeBuilder({ page: teacher })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await student.reload();
    await student
      .getByRole('button', { name: /Fraction reasoning review/ })
      .click();
    await expect(
      student.getByText('A COMPLETE, CONSISTENT SOLUTION'),
    ).toBeVisible();
    await expect(
      student.getByText(
        'The common denominator and exact fraction sum are correct.',
      ),
    ).toBeVisible();
    await student
      .getByRole('button', { name: 'Sign out', exact: true })
      .click();
    await student.getByRole('button', { name: 'Sign in', exact: true }).click();
    await student.getByLabel('Username', { exact: true }).fill(username);
    await student
      .getByLabel('Password · at least 12 characters')
      .fill('fictional-browser-password-42');
    await student
      .locator('form')
      .getByRole('button', { name: 'Sign in', exact: true })
      .click();
    await expect(
      student.getByRole('button', { name: /Fraction reasoning review/ }),
    ).toBeVisible();
  } finally {
    await teacherContext.close();
    await studentContext.close();
  }
});
test('keyboard skip link and demo navigation remain usable at 200 percent text zoom', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await page
    .getByRole('button', { name: 'Debug a student’s thinking' })
    .focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('button', { name: /The distribution detective/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Skill library' }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'The skill library.' }),
  ).toBeVisible();
});
