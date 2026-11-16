import '@testing-library/jest-dom/vitest';

// エイリアスではなく相対パスで引く。test/ は tsconfig.app.json の include（src）の
// 外にあり、@/ の解決経路に乗らない
import variables from '../src/styles/variables.css?inline';

/**
 * デザイントークンの CSS 変数を jsdom に読み込ませる。
 *
 * jsdom 31 から getComputedStyle が var() を解決するようになった。変数が未定義だと
 * プロパティの初期値へ潰れるため、`var(--font-weight-bold)` と
 * `var(--font-weight-normal)` がどちらも 400 として返り、スタイルの当たり方を
 * 確かめているテストが差を見分けられなくなる。落ちるだけなら気づけるが、
 * 2 つの要素の値を比べて「色が漏れていないこと」を見ているテストは
 * 黙って通る側へ倒れるため、実値が解決される状態を揃えておく。
 *
 * light-dark() も解決される（`color-scheme: light dark` の宣言からライト側が選ばれる）
 * ため、配色もトークンの実値で比較できる。
 */
const tokens = document.createElement('style');
tokens.textContent = variables;
document.head.appendChild(tokens);
