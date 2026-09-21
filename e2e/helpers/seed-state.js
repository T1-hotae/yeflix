// global-setup에서 만든 테스트 계정 uid를 워커 프로세스로 전달하기 위한 파일 저장소.

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '.state', 'seed.json');

function writeSeed(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function readSeed() {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(
      `시드 정보(${STATE_FILE})가 없습니다. Playwright global-setup이 실행됐는지 확인하세요.`,
    );
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

module.exports = { writeSeed, readSeed, STATE_FILE };
