import { useState } from 'react'
import './App.css'

const t = {
  ko: {
    title: '코드포스 발표자 선정기',
    subtitle: '순위표를 복사해 붙여넣으면 문제별 발표자를 정해줍니다.',
    placeholder: 'Friends standing 페이지에서 Ctrl+A -> Ctrl+V 하세요...',
    clear: '초기화',
    parse: '데이터 파싱 및 로드',
    manage: '대진표 관리',
    addProb: '문제 추가',
    delProb: '문제 삭제',
    pick: '발표자 랜덤 선정',
    hint: '💡 셀의 화살표(→)를 클릭하면 해당 위치부터 오른쪽으로 밀립니다.',
    shiftTitle: '여기서부터 오른쪽으로 밀기',
    delete: '삭제',
    results: '최종 발표자 명단',
    noSolver: '해결자 없음',
    addUser: '참여자 수동 추가',
    addBtn: '추가',
    namePlace: '이름 입력...',
    lang: 'English'
  },
  en: {
    title: 'CF Speaker Selector',
    subtitle: 'Paste standings to choose speakers for each problem.',
    placeholder: 'Ctrl+A -> Ctrl+V your friends standings here...',
    clear: 'Clear',
    parse: 'Parse & Load',
    manage: 'Manage Standings',
    addProb: 'Add Prob',
    delProb: 'Del Prob',
    pick: 'Pick Speakers',
    hint: '💡 Click (→) in a cell to shift solves from that position.',
    shiftTitle: 'Shift right from here',
    delete: 'Del',
    results: 'Speaker Assignments',
    noSolver: 'No Solver',
    addUser: 'Add Participant',
    addBtn: 'Add',
    namePlace: 'Enter name...',
    lang: '한국어'
  }
}

function App() {
  const [lang, setLang] = useState('ko')
  const [rawData, setRawData] = useState('')
  const [participants, setParticipants] = useState([])
  const [problems, setProblems] = useState(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
  const [assignments, setAssignments] = useState({})
  const [newName, setNewName] = useState('')

  const curT = t[lang]

  const parseData = () => {
    const lines = rawData.split('\n').map(l => l.trim())
    const participantBlocks = []
    let currentBlock = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue

      const rankMatch = line.match(/^(\d+)\s+\((\d+)\)(.*)$/)
      if (rankMatch) {
        if (currentBlock) participantBlocks.push(currentBlock)
        currentBlock = { rank: rankMatch[1], nameContent: rankMatch[3], extraLines: [] }
      } else if (currentBlock) {
        if (line.startsWith('Accepted') || line.startsWith('Tried')) {
          participantBlocks.push(currentBlock)
          currentBlock = null
          break
        }
        currentBlock.extraLines.push(line)
      }
    }
    if (currentBlock) participantBlocks.push(currentBlock)

    let maxTokenCount = 8
    const countries = ['South Korea', 'Korea, Republic of', 'United States', 'China', 'Russia', 'Japan', 'India', 'Kazakhstan', 'Vietnam', 'Ukraine', 'Poland', 'Germany', 'France', 'United Kingdom', 'Brazil', 'Canada', 'Belarus', 'Taiwan', 'Hong Kong', 'Singapore', 'Uzbekistan', 'Kyrgyzstan']
    const countryRegex = new RegExp(`^(${countries.join('|')})`, 'i')

    const parsedParticipants = participantBlocks.map(block => {
      let content = block.nameContent.trim()
      content = content.replace(countryRegex, '').trim()
      content = content.replace(/^\*\s+/, '').trim()

      // 모든 잠재적 토큰 추출 (+, -, 점수)
      // 이름 부분과 데이터 부분을 분리하기 위해 첫 번째 토큰 위치 탐색
      const tokens = []
      const allText = [content, ...block.extraLines].join(' ')
      
      // 정규식 설명: 
      // 1. [\+\-]\d+ (예: +1, -3)
      // 2. (?<!\d)\d{3,}(?!\d) (예: 492, 1244 - 시간과 구분되는 3자리 이상 숫자)
      // 3. \+ 또는 \- (단독 기호)
      // 4. (-\d+)(\d{3,}) (예: -31348 -> -3, 1348 분리)
      
      // 먼저 합쳐진 케이스 분리
      let cleanedText = allText.replace(/(-\d+)(\d{3,})/g, '$1 $2')
      
      // 시간(00:00) 제거
      cleanedText = cleanedText.replace(/\d{2}:\d{2}/g, ' ')

      const foundTokens = cleanedText.match(/([\+\-]\d+|[\+\-]|(?<![:\d])\d{3,}(?![:\d]))/g) || []
      
      // 이름 추출: 첫 번째 토큰이 나오기 전까지의 텍스트
      let name = block.nameContent.trim().replace(countryRegex, '').trim().replace(/^\*\s+/, '').trim()
      if (foundTokens.length > 0) {
        const firstToken = foundTokens[0]
        const firstIdx = content.indexOf(firstToken)
        if (firstIdx !== -1) {
          name = content.substring(0, firstIdx).trim()
        }
      }
      
      // 유저 핸들에서 # 뒷부분 등 정리
      name = name.split(/\s+/)[0].replace(/#\d+$/, '')

      if (foundTokens.length > maxTokenCount) maxTokenCount = foundTokens.length

      const solved = new Array(20).fill(false)
      foundTokens.forEach((token, idx) => {
        if (idx < 20) {
          if (token.startsWith('+') || (parseInt(token) >= 100)) {
            solved[idx] = true
          }
        }
      })

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: name || `User ${block.rank}`,
        solved
      }
    })

    const finalProblemCount = Math.max(maxTokenCount, 8)
    const newProblems = Array.from({ length: finalProblemCount }, (_, i) => String.fromCharCode(65 + i))
    
    setProblems(newProblems)
    setParticipants(parsedParticipants.map(p => ({
      ...p,
      solved: p.solved.slice(0, finalProblemCount)
    })))
    setAssignments({})
  }

  const toggleSolve = (pId, probIdx) => {
    setParticipants(participants.map(p => {
      if (p.id === pId) {
        const newSolved = [...p.solved]
        newSolved[probIdx] = !newSolved[probIdx]
        return { ...p, solved: newSolved }
      }
      return p
    }))
  }

  const shiftFrom = (pId, startIdx) => {
    setParticipants(participants.map(p => {
      if (p.id === pId) {
        const newSolved = [...p.solved]
        newSolved.splice(startIdx, 0, false)
        return { ...p, solved: newSolved.slice(0, problems.length) }
      }
      return p
    }))
  }

  const addManualParticipant = () => {
    if (!newName.trim()) return
    const newP = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName.trim(),
      solved: new Array(problems.length).fill(false)
    }
    setParticipants([...participants, newP])
    setNewName('')
  }

  const selectSpeakers = () => {
    const newAssignments = {}
    const usedSpeakers = new Set()
    const probInfo = problems.map((name, idx) => ({
      name, idx, solvers: participants.filter(p => p.solved[idx])
    })).sort((a, b) => a.solvers.length - b.solvers.length)
    
    for (const prob of probInfo) {
      const potentialSolvers = prob.solvers.filter(p => !usedSpeakers.has(p.id)).sort(() => Math.random() - 0.5)
      if (potentialSolvers.length > 0) {
        const selected = potentialSolvers[0]
        newAssignments[prob.name] = selected.name
        usedSpeakers.add(selected.id)
      }
    }

    for (const prob of probInfo) {
      if (!newAssignments[prob.name]) {
        const potentialSolvers = prob.solvers.sort(() => Math.random() - 0.5)
        newAssignments[prob.name] = potentialSolvers.length > 0 ? potentialSolvers[0].name : curT.noSolver
      }
    }
    setAssignments(newAssignments)
  }

  return (
    <div className="container">
      <div className="lang-toggle">
        <button onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}>{curT.lang}</button>
      </div>
      <header>
        <h1>{curT.title}</h1>
        <p className="subtitle">{curT.subtitle}</p>
      </header>
      
      <section className="input-section">
        <textarea 
          placeholder={curT.placeholder}
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
          rows={5}
        />
        <div className="actions">
          <button onClick={() => {setParticipants([]); setAssignments({}); setRawData('')}}>{curT.clear}</button>
          <button onClick={parseData} className="primary-btn">{curT.parse}</button>
        </div>
      </section>

      {participants.length > 0 && (
        <section className="table-section">
          <div className="table-header-flex">
            <h2>{curT.manage}</h2>
            <div className="table-controls">
              <button onClick={() => {
                const nextChar = String.fromCharCode(65 + problems.length)
                setProblems([...problems, nextChar])
                setParticipants(participants.map(p => ({ ...p, solved: [...p.solved, false] })))
              }}>{curT.addProb}</button>
              <button onClick={() => {
                if (problems.length <= 1) return
                setProblems(problems.slice(0, -1))
                setParticipants(participants.map(p => ({ ...p, solved: p.solved.slice(0, -1) })))
              }}>{curT.delProb}</button>
              <button onClick={selectSpeakers} className="success-btn">{curT.pick}</button>
            </div>
          </div>
          <p className="hint">{curT.hint}</p>
          <div className="table-container">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Name</th>
                  {problems.map(p => <th key={p}>{p}</th>)}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {participants.map(p => (
                  <tr key={p.id}>
                    <td className="name-cell">{p.name}</td>
                    {p.solved.map((isSolved, idx) => (
                      <td key={idx} className={`solve-cell ${isSolved ? 'solved' : 'not-solved'}`}>
                        <div className="cell-content">
                          <span className="check" onClick={() => toggleSolve(p.id, idx)}>
                            {isSolved ? '✔' : '-'}
                          </span>
                          <button className="mini-shift" onClick={() => shiftFrom(p.id, idx)} title={curT.shiftTitle}>→</button>
                        </div>
                      </td>
                    ))}
                    <td>
                      <button onClick={() => setParticipants(participants.filter(pt => pt.id !== p.id))} className="danger-text">{curT.delete}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="add-user-form">
            <h4>{curT.addUser}</h4>
            <input 
              type="text" 
              placeholder={curT.namePlace} 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && addManualParticipant()}
            />
            <button onClick={addManualParticipant}>{curT.addBtn}</button>
          </div>
        </section>
      )}

      {Object.keys(assignments).length > 0 && (
        <section className="results-section">
          <h2>{curT.results}</h2>
          <div className="assignment-grid">
            {problems.map(p => (
              <div key={p} className="assignment-card">
                <span className="prob-label">Problem {p}</span>
                <span className="speaker-name">{assignments[p]}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default App
