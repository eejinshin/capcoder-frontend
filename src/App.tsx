import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import './App.css';

// --- [아이콘 컴포넌트 (Apple Style SVGs)] ---
const IconHome = ({ active }: { active: boolean }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={active ? "#007aff" : "#C7C7CC"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const IconCalendar = ({ active }: { active: boolean }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={active ? "#007aff" : "#C7C7CC"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const IconUser = ({ active }: { active: boolean }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={active ? "#007aff" : "#C7C7CC"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

// --- [계산 로직] ---
type NutrientVector = {
  total_carb: number;
  sugar: number;
  protein: number;
  total_fat: number;
};

const CORR_WEIGHTS: NutrientVector = {
  total_carb: 0.20,
  sugar: 0.17,
  protein: 0.13,
  total_fat: 0.14,
};

const estimateGlucoseDeltaFromNutrients = (nutrients: NutrientVector): number => {
  const norm: NutrientVector = {
    total_carb: nutrients.total_carb / 10,
    sugar: nutrients.sugar / 5,
    protein: nutrients.protein / 5,
    total_fat: nutrients.total_fat,
  };

  const score =
    CORR_WEIGHTS.total_carb * norm.total_carb +
    CORR_WEIGHTS.sugar * norm.sugar +
    CORR_WEIGHTS.protein * norm.protein +
    CORR_WEIGHTS.total_fat * norm.total_fat;

  const deltaGlucose = score * 40;
  return deltaGlucose;
};

const estimatePostMealGlucose = (
  nutrients: NutrientVector,
  baseGlucose: number = 100,
): number => {
  const delta = estimateGlucoseDeltaFromNutrients(nutrients);
  let predicted = baseGlucose + delta;
  predicted = Math.max(80, Math.min(250, predicted));
  return Math.round(predicted);
};
// ------------------------------------

type ModalState = 'hidden' | 'login' | 'signup';
type TabState = 'main' | 'calendar' | 'mypage';
type MealInputType = 'text' | 'photo';
type GlucoseStatus = 'normal' | 'pre-diabetic' | 'danger';

type PredictionRecord = {
  fullDate: string;
  displayTime: string;
  value: number;
};

// [수정] name 필드 추가된 버전
type UserInfo = {
  name: string;
  gender: 'male' | 'female';
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  height: string;
  weight: string;
};

// [0] 혈당 상태 그래프
const GlucoseStatusGraph = ({ value, status }: { value: number; status: GlucoseStatus | null }) => {
  if (!status) return null;
  const getIndicatorPosition = () => {
    const min = 80; const max = 250;
    const clampedValue = Math.max(min, Math.min(value, max));
    const percentage = ((clampedValue - min) / (max - min)) * 100;
    return `max(0%, min(98%, ${percentage}%))`;
  };
  const statusInfo = {
    normal: { text: '정상', className: 'normal' },
    'pre-diabetic': { text: '당뇨 전단계', className: 'pre-diabetic' },
    danger: { text: '당뇨 관리 필요', className: 'danger' },
  };
  const currentStatus = statusInfo[status];

  return (
    <div className="status-graph-container">
      <div className="status-indicator" style={{ left: getIndicatorPosition() }}>
        <div className="indicator-value">{value}</div>
        <div className="indicator-arrow">▼</div>
      </div>
      <div className="status-bar">
        <div className="bar-segment normal" style={{ width: '35.3%' }}></div>
        <div className="bar-segment pre-diabetic" style={{ width: '34.7%' }}></div>
        <div className="bar-segment danger" style={{ width: '30%' }}></div>
      </div>
      <div className="status-labels">
        <span style={{ left: '35.3%' }}>140</span>
        <span style={{ left: '70%' }}>200</span>
      </div>
      <p className={`status-text ${currentStatus.className}`}>{currentStatus.text}</p>
    </div>
  );
};

// [1] 로그인 페이지
const LoginPage = ({ onPageChange, onLoginSuccess }: { onPageChange: (page: ModalState) => void; onLoginSuccess: (userInfo: UserInfo) => void; }) => {
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const handleLogin = async () => {
    console.log('로그인 시도:', { loginId, loginPw });
    try {
      const loginResponse = await fetch('https://capcoder-backendauth.onrender.com/api/member/loginAction.do', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loginId, password: loginPw }),
      });
      if (!loginResponse.ok) { alert('로그인 실패'); return; }
      const loginData = await loginResponse.json();
      const token = loginData.token;
      if (!token) { alert('토큰 없음'); return; }
      localStorage.setItem('authToken', token);

      const userInfoResponse = await fetch('https://capcoder-backendauth.onrender.com/api/member/userInfo.do', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!userInfoResponse.ok) throw new Error('유저 정보 로드 실패');
      const userInfoData = await userInfoResponse.json();
      const [year, month, day] = (userInfoData.birthDate || '---').split('-');
      
      const userInfoFromBackend: UserInfo = {
        name: userInfoData.name || '회원', 
        gender: userInfoData.gender === 'female' ? 'female' : 'male',
        birthYear: year !== '-' ? year : '',
        birthMonth: month !== '-' ? month : '',
        birthDay: day !== '-' ? day : '',
        height: String(userInfoData.height || ''),
        weight: String(userInfoData.weight || ''),
      };
      alert('로그인 성공!');
      onLoginSuccess(userInfoFromBackend);
    } catch (error) {
      console.error(error);
      alert('로그인 중 오류 발생');
      localStorage.removeItem('authToken');
    }
  };

  return (
    <>
      <h1>로그인</h1>
      <div className="input-group"><label>ID</label><input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} /></div>
      <div className="input-group"><label>PW</label><input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} /></div>
      <button className="auth-button" onClick={handleLogin}>로그인하기</button>
      <div className="auth-switch"><span>계정이 없으신가요? </span><a href="#" onClick={(e) => { e.preventDefault(); onPageChange('signup'); }}>회원가입</a></div>
    </>
  );
};

// [2] 회원가입 페이지
const SignupPage = ({ onPageChange }: { onPageChange: (page: ModalState) => void }) => {
  const [signupForm, setSignupForm] = useState({ name: '', gender: 'male', birthYear: '', birthMonth: '', birthDay: '', height: '', weight: '', id: '', pw: '' });
  const [idCheck, setIdCheck] = useState({ checked: false, available: false, message: '' });
  const [isCheckingId, setIsCheckingId] = useState(false);

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSignupForm({ ...signupForm, [name]: value });
    if (name === 'id') setIdCheck({ checked: false, available: false, message: '' });
  };

  const handleIdCheck = async () => {
    if (!signupForm.id) return alert('아이디 입력 필요');
    setIsCheckingId(true);
    try {
      const params = new URLSearchParams();
      params.append('userId', signupForm.id);
      const response = await fetch('https://capcoder-backendauth.onrender.com/api/member/checkId', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });
      if (response.ok) {
        const data = await response.json();
        if (data.available) setIdCheck({ checked: true, available: true, message: '사용 가능' });
        else setIdCheck({ checked: true, available: false, message: '이미 사용 중' });
      }
    } catch (e) { alert('중복 확인 오류'); }
    setIsCheckingId(false);
  };

  const handleSignup = async () => {
    if (!idCheck.checked || !idCheck.available) return alert('중복 확인 필요');
    try {
      const response = await fetch('https://capcoder-backendauth.onrender.com/api/member/regist.do', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: signupForm.id,
          password: signupForm.pw,
          name: signupForm.name,
          gender: signupForm.gender,
          birthDate: `${signupForm.birthYear}-${signupForm.birthMonth.padStart(2, '0')}-${signupForm.birthDay.padStart(2, '0')}`,
          height: signupForm.height,
          weight: signupForm.weight,
        }),
      });
      if (response.ok) { alert('가입 성공'); onPageChange('login'); }
      else alert('가입 실패');
    } catch (e) { alert('오류 발생'); }
  };

  return (
    <>
      <h1>회원가입</h1>
      <div className="input-group"><label>이름(닉네임)</label><input name="name" value={signupForm.name} onChange={handleSignupChange} /></div>
      <div className="input-group"><label>성별</label><div className="radio-group"><label><input type="radio" name="gender" value="male" checked={signupForm.gender === 'male'} onChange={handleSignupChange} /> 남</label><label><input type="radio" name="gender" value="female" checked={signupForm.gender === 'female'} onChange={handleSignupChange} /> 여</label></div></div>
      <div className="input-group"><label>생년월일</label><div className="birth-group"><input name="birthYear" placeholder="YYYY" value={signupForm.birthYear} onChange={handleSignupChange} /><input name="birthMonth" placeholder="MM" value={signupForm.birthMonth} onChange={handleSignupChange} /><input name="birthDay" placeholder="DD" value={signupForm.birthDay} onChange={handleSignupChange} /></div></div>
      <div className="input-group"><label>키</label><input name="height" value={signupForm.height} onChange={handleSignupChange} /></div>
      <div className="input-group"><label>체중</label><input name="weight" value={signupForm.weight} onChange={handleSignupChange} /></div>
      <div className="input-group"><label>ID</label><div className="id-check-group"><input name="id" value={signupForm.id} onChange={handleSignupChange} /><button className="id-check-button" onClick={handleIdCheck} disabled={isCheckingId}>중복 확인</button></div>{idCheck.message && <p className="id-check-message" style={{ color: idCheck.available ? 'green' : 'red' }}>{idCheck.message}</p>}</div>
      <div className="input-group"><label>PW</label><input name="pw" type="password" value={signupForm.pw} onChange={handleSignupChange} /></div>
      <button className="auth-button" onClick={handleSignup}>가입하기</button>
      <div className="auth-switch"><span>이미 계정이 있으신가요? </span><a href="#" onClick={(e) => { e.preventDefault(); onPageChange('login'); }}>로그인</a></div>
    </>
  );
};

// [3] 마이페이지 (수정 기능 완벽 포함)
const MyPage = ({ userInfo, onLogout, onUpdateUser }: { userInfo: UserInfo | null, onLogout: () => void, onUpdateUser: (updated: UserInfo) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (userInfo) setEditForm(userInfo);
  }, [userInfo]);

  if (!userInfo || !editForm) return <div>로딩 중...</div>;

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://capcoder-backendauth.onrender.com/api/member/mypage.do', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          gender: editForm.gender,
          height: Number(editForm.height),
          weight: Number(editForm.weight),
          birthDate: `${editForm.birthYear}-${editForm.birthMonth.padStart(2, '0')}-${editForm.birthDay.padStart(2, '0')}`
        })
      });

      if (response.ok) {
        alert('정보가 수정되었습니다.');
        onUpdateUser(editForm);
        setIsEditing(false);
      } else {
        alert('수정 실패');
      }
    } catch (error) {
      console.error(error);
      alert('서버 오류 발생');
    }
  };

  return (
    <div className="mypage-container">
      <div className="profile-card">
        <div className="character-area"><span style={{ fontSize: '4rem' }}>{userInfo.gender === 'male' ? '👦' : '👧'}</span></div>
        
        {/* 닉네임 표시 부분 (여기 userInfo.name이 들어가야 함!) */}
        <h2>{userInfo.name} 회원님</h2>
        
        {!isEditing && (
          <p className="sub-text">생년월일: {userInfo.birthYear}.{userInfo.birthMonth}.{userInfo.birthDay}</p>
        )}
      </div>

      {isEditing ? (
        <div className="edit-form">
          <h3>정보 수정</h3>
          <div className="input-group"><label>이름</label><input name="name" value={editForm.name} onChange={handleEditChange} /></div>
          <div className="input-group"><label>생년월일</label>
            <div className="birth-group">
              <input name="birthYear" value={editForm.birthYear} onChange={handleEditChange} placeholder="YYYY" />
              <input name="birthMonth" value={editForm.birthMonth} onChange={handleEditChange} placeholder="MM" />
              <input name="birthDay" value={editForm.birthDay} onChange={handleEditChange} placeholder="DD" />
            </div>
          </div>
          <div className="input-group"><label>키 (cm)</label><input name="height" value={editForm.height} onChange={handleEditChange} /></div>
          <div className="input-group"><label>몸무게 (kg)</label><input name="weight" value={editForm.weight} onChange={handleEditChange} /></div>
          <div className="edit-buttons">
            <button className="save-btn" onClick={handleSave}>저장</button>
            <button className="cancel-btn" onClick={() => { setIsEditing(false); setEditForm(userInfo); }}>취소</button>
          </div>
        </div>
      ) : (
        <>
          <div className="info-list">
            <div className="info-item"><span className="label">키</span><span className="value">{userInfo.height} cm</span></div>
            <div className="info-item"><span className="label">몸무게</span><span className="value">{userInfo.weight} kg</span></div>
          </div>
          {/* 수정 버튼 (여기에 있어야 함!) */}
          <button className="edit-mode-btn" onClick={() => setIsEditing(true)}>개인정보 수정하기</button>
          <button className="auth-button logout-button" onClick={onLogout}>로그아웃</button>
        </>
      )}
    </div>
  );
};

// [New] 캘린더 페이지 (애플 스타일: 대표 상태 점 하나만 표시)
const CalendarPage = ({ history }: { history: PredictionRecord[] }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(todayStr);
  }, []);

  const moveMonth = (direction: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + direction, 1);
    setViewDate(newDate);
  };

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth() + 1;
  const daysInCurrentMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysArray = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  const dailyData = history
    .filter(record => record.fullDate === selectedDate)
    .sort((a, b) => a.displayTime.localeCompare(b.displayTime));

  // [핵심] 그날의 '대표 색상' 결정 로직 (위험 > 주의 > 정상 순서)
  const getDayStatusColor = (records: PredictionRecord[]) => {
    if (records.length === 0) return null;
    // 1. 하나라도 위험(200 이상)이 있으면 빨강
    if (records.some(r => r.value > 199)) return 'var(--ios-danger)';
    // 2. 위험은 없지만 주의(140 이상)가 있으면 주황
    if (records.some(r => r.value > 140)) return 'var(--ios-warning)';
    // 3. 나머지는 초록
    return 'var(--ios-success)';
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="nav-btn" onClick={() => moveMonth(-1)}>&lt;</button>
        <h2>{viewYear}년 {viewMonth}월</h2>
        <button className="nav-btn" onClick={() => moveMonth(1)}>&gt;</button>
      </div>
      
      <div className="calendar-grid">
        {WEEKDAYS.map((day, idx) => (
          <div key={day} className={`weekday-header ${idx === 0 ? 'sunday' : ''}`}>
            {day}
          </div>
        ))}

        {emptySlots.map(i => <div key={`empty-${i}`} className="empty-day"></div>)}

        {daysArray.map(day => {
          const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayRecords = history.filter(r => r.fullDate === dateStr);
          const dotColor = getDayStatusColor(dayRecords);
          
          return (
            <button
              key={day}
              className={`calendar-day ${selectedDate === dateStr ? 'selected' : ''}`}
              onClick={() => setSelectedDate(dateStr)}
            >
              <span className="day-number">{day}</span>
              {/* 기록이 있을 때만 점 하나 표시 */}
              {dotColor && (
                <div className="dot" style={{ backgroundColor: dotColor }} />
              )}
            </button>
          );
        })}
      </div>

      <div className="daily-chart-section">
        <h3>{selectedDate} 기록</h3>
        {dailyData.length > 0 ? (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayTime" fontSize={12} />
                <YAxis domain={[80, 250]} fontSize={12} />
                <Tooltip />
                <Legend />
                <ReferenceLine y={140} label="정상" stroke="green" strokeDasharray="3 3" />
                <ReferenceLine y={200} label="주의" stroke="red" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="value" name="예측 혈당" stroke="#007aff" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="no-data">이 날짜의 기록이 없습니다.</p>}
      </div>

      <div style={{ height: '150px', width: '100%' }}></div>
    </div>
  );
};

// [4] 메인 예측 페이지 (handleSubmit 부분 수정: 24시간제 적용)
const MainPage = ({ onNewPrediction, userInfo }: { onNewPrediction: (record: PredictionRecord) => void; userInfo: UserInfo | null; }) => {
  // ... (기존 state들은 그대로 유지) ...
  const [formData, setFormData] = useState({ gender: 'male', height: '', weight: '', birthYear: '', birthMonth: '', birthDay: '', mealText: '' });
  const [mealInputType, setMealInputType] = useState<MealInputType>('text');
  const [mealFile, setMealFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [predictedGlucose, setPredictedGlucose] = useState<number | null>(null);
  const [glucoseStatus, setGlucoseStatus] = useState<GlucoseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ... (useEffect, handleInputChange, handleFileChange는 그대로 유지) ...
  useEffect(() => {
    if (userInfo) {
      setFormData(prev => ({ ...prev, gender: userInfo.gender, height: userInfo.height, weight: userInfo.weight, birthYear: userInfo.birthYear, birthMonth: userInfo.birthMonth, birthDay: userInfo.birthDay }));
    }
  }, [userInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMealFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPredictedGlucose(null); setGlucoseStatus(null);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true); setPredictedGlucose(null); setGlucoseStatus(null);
    const apiFormData = new FormData();
    apiFormData.append("gender", formData.gender); apiFormData.append("height", formData.height); apiFormData.append("weight", formData.weight); apiFormData.append("birthYear", formData.birthYear);

    try {
      let resultValue = 0;
      // ... (API 호출 로직 그대로 유지) ...
      if (mealInputType === "text") {
        if (!formData.mealText.trim()) { alert("식단 입력 필요"); setIsLoading(false); return; }
        const searchResp = await fetch(`https://capcoder-backendauth.onrender.com/api/food/search?keyword=${encodeURIComponent(formData.mealText)}`);
        if (!searchResp.ok) throw new Error("검색 실패");
        const foods = await searchResp.json();
        if (!foods || foods.length === 0) { alert("검색 결과 없음"); setIsLoading(false); return; }
        const selectedFood = foods[0];
        const nutrients = { total_carb: Number(selectedFood.carbohydrates ?? 0), sugar: Number(selectedFood.sugars ?? 0), protein: Number(selectedFood.protein ?? 0), total_fat: Number(selectedFood.fat ?? 0) };
        resultValue = estimatePostMealGlucose(nutrients, 100);
      } else if (mealFile) {
        apiFormData.append('image', mealFile);
        const response = await fetch('https://capcoder-backendauth.onrender.com/api/gemini/imagedb', { method: 'POST', body: apiFormData });
        if (!response.ok) throw new Error("이미지 분석 실패");
        const raw = await response.text();
        const jsonData = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
        
        if (typeof jsonData.predictedGlucose === 'number') {
          resultValue = jsonData.predictedGlucose;
        } else {
          const currentNutrients = { total_carb: parseFloat(jsonData.total_carb) || 0, sugar: parseFloat(jsonData.sugar) || 0, protein: parseFloat(jsonData.protein) || 0, total_fat: parseFloat(jsonData.total_fat) || 0 };
          resultValue = estimatePostMealGlucose(currentNutrients, 100);
        }
      } else { alert('입력 확인 필요'); setIsLoading(false); return; }

      setPredictedGlucose(resultValue);
      let status: GlucoseStatus = 'normal';
      if (resultValue > 199) status = 'danger'; else if (resultValue > 140) status = 'pre-diabetic';
      setGlucoseStatus(status);


      // 1. 현재 시간 가져오기
      const now = new Date();
      
      // 2. [계산] 현재 시간 + 2시간 (날짜 넘어가는 것도 알아서 계산됨)
      const futureDate = new Date(now.getTime() + (2 * 60 * 60 * 1000));

      // 3. [중요] 계산된 'futureDate'를 기준으로 날짜 문자열 만들기
      // (이렇게 해야 23시에 먹으면 다음날 캘린더에 저장됨)
      const fullDate = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;
      
      // 4. 시간 문자열 만들기 (오후 01:00 -> 13:00)
      const displayTime = futureDate.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
      
      // 5. 저장
      onNewPrediction({ fullDate, displayTime, value: resultValue });

    } catch (error) { console.error(error); alert('예측 중 오류 발생'); }
    setIsLoading(false);
  };

  return (
    <div className="main-container">
        {/* (기존 JSX 코드 그대로 유지) */}
        <h1>혈당 예측</h1>
        <div className="input-group"><label>성별</label><div className="radio-group"><label><input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleInputChange} /> 남</label><label><input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleInputChange} /> 여</label></div></div>
        <div className="input-group"><label>생년월일</label><div className="birth-group"><input name="birthYear" placeholder="YYYY" value={formData.birthYear} onChange={handleInputChange} /><input name="birthMonth" placeholder="MM" value={formData.birthMonth} onChange={handleInputChange} /><input name="birthDay" placeholder="DD" value={formData.birthDay} onChange={handleInputChange} /></div></div>
        <div className="input-group"><label>키 (cm)</label><input name="height" type="number" value={formData.height} onChange={handleInputChange} /></div>
        <div className="input-group"><label>체중 (kg)</label><input name="weight" type="number" value={formData.weight} onChange={handleInputChange} /></div>
        <div className="input-group"><label>식단</label><div className="meal-input-group"><button className={mealInputType === 'text' ? 'active' : ''} onClick={() => setMealInputType('text')}>직접 입력</button><button className={mealInputType === 'photo' ? 'active' : ''} onClick={() => setMealInputType('photo')}>사진 첨부</button></div>
            {mealInputType === 'text' ? <input name="mealText" value={formData.mealText} onChange={handleInputChange} placeholder="예: 떡볶이" style={{ marginTop: '1rem' }} /> : <div><input type="file" accept="image/*" onChange={handleFileChange} style={{ marginTop: '1rem' }} />{previewUrl && <div style={{ marginTop: "1rem" }}><img src={previewUrl} alt="미리보기" style={{ maxWidth: "200px" }} /></div>}</div>}
        </div>
        <button className="predict-button" onClick={handleSubmit} disabled={isLoading}>{isLoading ? '예측 중...' : '예측하기'}</button>
        <div className="result-container">
            <h2>예상 식후 2시간 혈당</h2>
            {predictedGlucose ? <><p className="result-value">{predictedGlucose} <span>mg/dL</span></p><GlucoseStatusGraph value={predictedGlucose} status={glucoseStatus} /></> : <p className="result-placeholder">정보를 입력하고 버튼을 눌러주세요.</p>}
        </div>
    </div>
  );
};


// [5] 인증 모달 (로그인/회원가입 전용)
const AuthModal = ({ modalPage, onPageChange, onClose, onLoginSuccess }: { modalPage: ModalState, onPageChange: (p: ModalState) => void, onClose: () => void, onLoginSuccess: (u: UserInfo) => void }) => {
  if (modalPage === 'hidden') return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        {modalPage === 'login' && <LoginPage onPageChange={onPageChange} onLoginSuccess={onLoginSuccess} />}
        {modalPage === 'signup' && <SignupPage onPageChange={onPageChange} />}
      </div>
    </div>
  );
};

// [6] 로그인 필요 안내 컴포넌트
const LoginRequiredView = ({ onLoginClick }: { onLoginClick: () => void }) => (
  <div className="login-required-container">
    <div className="icon">🔒</div>
    <h2>로그인이 필요한 기능입니다</h2>
    <p>나의 혈당 기록을 관리하고 싶다면<br />로그인을 진행해주세요.</p>
    <button className="auth-button" onClick={onLoginClick}>로그인 하러 가기</button>
  </div>
);

// [App] 메인 앱
function App() {
  const [modalPage, setModalPage] = useState<ModalState>('hidden');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState<PredictionRecord[]>([]);
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null);
  const [currentTab, setCurrentTab] = useState<TabState>('main');

  const handleCloseModal = () => setModalPage('hidden');
  
  const handleLoginSuccess = (userInfo: UserInfo) => {
    setIsLoggedIn(true); setModalPage('hidden'); setCurrentUserInfo(userInfo);
    const todayStr = new Date().toISOString().split('T')[0];
    setPredictionHistory([{ fullDate: todayStr, displayTime: '10:00', value: 120 }, { fullDate: todayStr, displayTime: '14:30', value: 155 }]);
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setModalPage('hidden'); setPredictionHistory([]); setCurrentUserInfo(null);
    localStorage.removeItem('authToken');
    setCurrentTab('main');
    alert('로그아웃되었습니다.');
  };

  // [수정] 사용자 정보 업데이트 핸들러
  const handleUserInfoUpdate = (updatedUser: UserInfo) => {
    setCurrentUserInfo(updatedUser);
  };

  const handleNewPrediction = (newRecord: PredictionRecord) => {
    if (isLoggedIn) setPredictionHistory(prev => [...prev, newRecord]);
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const fetchUserInfoOnLoad = async () => {
        try {
          const userInfoResponse = await fetch('https://capcoder-backendauth.onrender.com/api/member/userInfo.do', { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
          if (userInfoResponse.ok) {
            const userInfoData = await userInfoResponse.json();
            const [year, month, day] = (userInfoData.birthDate || '---').split('-');
            const userInfoFromBackend: UserInfo = {
              name: userInfoData.name || '회원', // [수정] 이름
              gender: userInfoData.gender === 'female' ? 'female' : 'male',
              birthYear: year !== '-' ? year : '',
              birthMonth: month !== '-' ? month : '',
              birthDay: day !== '-' ? day : '',
              height: String(userInfoData.height || ''),
              weight: String(userInfoData.weight || ''),
            };
            handleLoginSuccess(userInfoFromBackend);
          } else {
            localStorage.removeItem('authToken'); setIsLoggedIn(false);
          }
        } catch (error) { localStorage.removeItem('authToken'); setIsLoggedIn(false); }
      };
      fetchUserInfoOnLoad();
    }
  }, []);

  return (
    <div className="App">
      <div className="content-area">
        {currentTab === 'main' && (
          <MainPage onNewPrediction={handleNewPrediction} userInfo={currentUserInfo} />
        )}
        
        {currentTab === 'calendar' && (
          isLoggedIn ? <CalendarPage history={predictionHistory} /> : <LoginRequiredView onLoginClick={() => setModalPage('login')} />
        )}
        
        {currentTab === 'mypage' && (
          isLoggedIn ? <MyPage userInfo={currentUserInfo} onLogout={handleLogout} onUpdateUser={handleUserInfoUpdate} /> : <LoginRequiredView onLoginClick={() => setModalPage('login')} />
        )}
      </div>

      {/* 3. 하단 고정 네비게이션 바 (아이콘 교체됨) */}
      <nav className="bottom-nav-bar">
        <button 
          className={currentTab === 'main' ? 'active' : ''} 
          onClick={() => setCurrentTab('main')}
        >
          <div className="nav-icon-wrapper">
            <IconHome active={currentTab === 'main'} />
            <span className="nav-label">홈</span>
          </div>
        </button>
        
        <button 
          className={currentTab === 'calendar' ? 'active' : ''} 
          onClick={() => setCurrentTab('calendar')}
        >
          <div className="nav-icon-wrapper">
            <IconCalendar active={currentTab === 'calendar'} />
            <span className="nav-label">기록</span>
          </div>
        </button>
        
        <button 
          className={currentTab === 'mypage' ? 'active' : ''} 
          onClick={() => setCurrentTab('mypage')}
        >
          <div className="nav-icon-wrapper">
            <IconUser active={currentTab === 'mypage'} />
            <span className="nav-label">마이</span>
          </div>
        </button>
      </nav>

      <AuthModal modalPage={modalPage} onPageChange={setModalPage} onClose={handleCloseModal} onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}

export default App;