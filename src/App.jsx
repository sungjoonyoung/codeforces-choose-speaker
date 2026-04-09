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
    const lines = rawData.split('\n').map(l => l.trim()).filter(l => l)
    const participantBlocks = []
    let currentBlock = null

    // 1. 블록 분리 및 Unofficial 데이터(*) 차단
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.includes('*')) break;

      const rankMatch = line.match(/^\s*(\d+)\s*\(\s*(\d+)\s*\)\s*(.*)$/)
      if (rankMatch) {
        if (currentBlock) participantBlocks.push(currentBlock)
        currentBlock = { rank: rankMatch[1], header: rankMatch[3], extra: [] }
      } else if (currentBlock) {
        if (line.startsWith('Accepted') || line.startsWith('Tried') || line.includes('Copyright')) {
          participantBlocks.push(currentBlock)
          currentBlock = null
          break
        }
        currentBlock.extra.push(line)
      }
    }
    if (currentBlock) participantBlocks.push(currentBlock)

    const countries = ['South Korea', 'Korea, Republic of', 'United States', 'China', 'Russia', 'Japan', 'India', 'Kazakhstan', 'Vietnam', 'Ukraine', 'Poland', 'Germany', 'France', 'United Kingdom', 'Brazil', 'Canada', 'Belarus', 'Taiwan', 'Hong Kong', 'Singapore', 'Uzbekistan', 'Kyrgyzstan']
    const countryRegex = new RegExp(`^(${countries.join('|')})`, 'i')

    let maxSolveTokens = 8

    const parsed = participantBlocks.map(block => {
      let headerText = block.header.trim().replace(countryRegex, '').trim();
      
      // 2. 이름 및 요약 데이터(#) 분리
      // 예: sungso376#6225 -> name: sungso376, summary: 6225
      const hashIdx = headerText.indexOf('#');
      let name = "";
      let summaryText = "";
      let remainingHeader = "";

      if (hashIdx !== -1) {
        name = headerText.substring(0, hashIdx).trim();
        const afterHash = headerText.substring(hashIdx + 1);
        const firstSpace = afterHash.indexOf(' ');
        if (firstSpace !== -1) {
          summaryText = afterHash.substring(0, firstSpace);
          remainingHeader = afterHash.substring(firstSpace);
        } else {
          summaryText = afterHash;
        }
      } else {
        const words = headerText.split(/\s+/);
        name = words[0];
        remainingHeader = words.slice(1).join(' ');
      }

      // 3. 문제 풀이 토큰 추출
      const combinedSolveText = [remainingHeader, ...block.extra].join(' ');
      let cleaned = combinedSolveText.replace(/\d{2}:\d{2}/g, ' '); // 시간 제거
      cleaned = cleaned.replace(/(-\d+)(\d{3,})/g, '$1 $2'); // 합쳐진 토큰 분리
      
      const allTokens = cleaned.match(/([\+\-]\d+|[\+\-]|(?<![:\d])\d{3,}(?![:\d])|\b\d+\b)/g) || [];
      
      // #이 없는 경우 첫 번째 숫자는 총점일 가능성이 높으므로 제거
      const solveTokens = (hashIdx === -1 && allTokens.length > 0) ? allTokens.slice(1) : allTokens;

      if (solveTokens.length > maxSolveTokens) maxSolveTokens = solveTokens.length

      const solved = new Array(20).fill(false)
      solveTokens.forEach((token, idx) => {
        if (idx < 20) {
          // +기호이거나 100점 이상의 점수면 해결로 간주
          if (token.startsWith('+') || parseInt(token) >= 100) {
            solved[idx] = true
          }
        }
      })

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: name || `User${block.rank}`,
        solved
      }
    })

    const finalCount = Math.max(maxSolveTokens, 8)
    setProblems(Array.from({ length: finalCount }, (_, i) => String.fromCharCode(65 + i)))
    setParticipants(parsed.map(p => ({ ...p, solved: p.solved.slice(0, finalCount) })))
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
    setParticipants([...participants, {
      id: Math.random().toString(36).substr(2, 9),
      name: newName.trim(),
      solved: new Array(problems.length).fill(false)
    }])
    setNewName('')
  }

  const selectSpeakers = () => {
    const newAssignments = {}
    const used = new Set()
    const probInfo = problems.map((name, idx) => ({
      name, idx, solvers: participants.filter(p => p.solved[idx])
    })).sort((a, b) => a.solvers.length - b.solvers.length)
    
    probInfo.forEach(prob => {
      const potential = prob.solvers.filter(p => !used.has(p.id)).sort(() => Math.random() - 0.5)
      if (potential.length > 0) {
        newAssignments[prob.name] = potential[0].name
        used.add(potential[0].id)
      }
    })

    probInfo.forEach(prob => {
      if (!newAssignments[prob.name]) {
        const potential = prob.solvers.sort(() => Math.random() - 0.5)
        newAssignments[prob.name] = potential.length > 0 ? potential[0].name : curT.noSolver
      }
    })
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
                setProblems([...problems, String.fromCharCode(65 + problems.length)])
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
