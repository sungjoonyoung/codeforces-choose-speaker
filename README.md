# Codeforces Speaker Selector (코드포스 발표자 선정기) 🏆

[English Description is below.](#english)

---

<a name="한국어"></a>

# 코드포스 발표자 선정기 🏆

코드포스(Codeforces) 버추얼 콘테스트나 연습 종료 후, 스터디원들과 각자 푼 문제를 기반으로 발표자를 공정하고 빠르게 선정하기 위한 웹 도구입니다.

## 🚀 주요 기능
- **간편한 데이터 로드**: 코드포스 **FRIENDS STANDING** 페이지에서 `Ctrl+A` -> `Ctrl+C` 후 바로 붙여넣기만 하면 파싱이 완료됩니다.
- **다양한 포맷 지원**: `+` 방식과 점수제 방식을 모두 지원하며, 유저 핸들(예: `sungso376`) 내 숫자를 정확히 보존합니다.
- **최적의 발표자 매칭**: 최대한 많은 스터디원이 서로 다른 문제를 하나씩 발표할 수 있도록(Unique matching) 알고리즘이 자동으로 배정합니다.
- **수동 편집 및 보정**: 파싱이 완벽하지 않거나 특정 유저를 제외/추가해야 할 때 테이블에서 직접 수정할 수 있습니다.
- **다국어 지원**: 한국어와 영어 UI를 제공합니다.

## 📝 사용 방법
1. **데이터 복사**: 코드포스 연습 결과의 `Friends standings` 탭으로 이동합니다.
2. **전체 선택**: 해당 페이지에서 `Ctrl+A`를 눌러 전체를 선택하고 `Ctrl+C`로 복사합니다.
3. **붙여넣기 및 파싱**: 본 도구의 텍스트 영역에 붙여넣고 **데이터 파싱 및 로드** 버튼을 누릅니다.
4. **대진표 확인 및 수정**:
   - 파싱된 데이터가 정확한지 확인합니다.
   - **중요**: 코드포스 복사 시 특정 칸이 누락되어 데이터가 당겨질 수 있습니다. 이 경우 셀 하단의 **회색 화살표(→) 버튼**을 눌러 해당 위치부터 오른쪽으로 한 칸씩 밀어 정확한 문제 위치로 보정할 수 있습니다.
   - 필요에 따라 수동으로 체크(`✔`)를 하거나 참여자를 추가/삭제할 수 있습니다.
5. **발표자 선정**: **발표자 랜덤 선정** 버튼을 누르면 화면 하단에 결과가 나타납니다.

## 🛠 기술 스택
- **Framework**: React 19 (Vite)
- **Styling**: Vanilla CSS
- **Iconography**: Custom SVG Icons (🇰🇷/🇺🇸 Flag)

## 💡 개발 목적
코드포스 스터디 진행 시 순위표를 일일이 보며 누가 어떤 문제를 풀었는지 확인하고 사다리 타기를 돌리는 번거로움을 줄이기 위해 제작되었습니다. 특히 복잡한 정규식을 통해 다양한 코드포스 순위표 패턴을 분석하여 사용자 편의성을 극대화했습니다.

---

<a name="english"></a>

# Codeforces Speaker Selector 🏆

A web-based tool designed to fairly and quickly select speakers for each problem solved during Codeforces virtual contests or practice sessions.

## 🚀 Features
- **Easy Data Loading**: Simply `Ctrl+A` -> `Ctrl+C` on the Codeforces **FRIENDS STANDING** page and paste it directly. Parsing is done automatically.
- **Support for Various Formats**: Supports both `+` marker style and score-based style. It accurately preserves user handles containing numbers (e.g., `sungso376`).
- **Optimal Speaker Matching**: An algorithm automatically assigns speakers to ensure that as many study members as possible can present different problems (Unique matching).
- **Manual Editing & Correction**: You can manually edit the table if the parsing isn't perfect or if you need to add/remove specific participants.
- **Multilingual Support**: Provides UI in both Korean and English.

## 📝 How to Use
1. **Copy Data**: Go to the `Friends standings` tab of your Codeforces practice results.
2. **Select All**: Press `Ctrl+A` to select everything and `Ctrl+C` to copy.
3. **Paste & Parse**: Paste it into the text area of this tool and click the **Parse & Load** button.
4. **Verify & Edit Standings**:
   - Check if the parsed data is accurate.
   - **Important**: When copying from Codeforces, some cells might be missing, causing data to shift. In this case, click the **gray arrow (→) button** at the bottom of a cell to shift data one column to the right for correction.
   - You can manually check/uncheck (`✔`) or add/delete participants as needed.
5. **Select Speakers**: Click the **Pick Speakers** button, and the results will appear at the bottom.

## 🛠 Tech Stack
- **Framework**: React 19 (Vite)
- **Styling**: Vanilla CSS
- **Iconography**: Custom SVG Icons (🇰🇷/🇺🇸 Flag)

## 💡 Goal
This tool was created to reduce the hassle of manually checking who solved what and running a separate randomizer for Codeforces study groups. It maximizes user convenience by using complex regular expressions to analyze various Codeforces standings patterns.

---
*Developed with Gemini CLI*
