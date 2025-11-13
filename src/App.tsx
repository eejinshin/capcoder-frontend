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
import './App.css'; // CSS 파일을 분리하여 import

// TypeScript: 모달에 보여줄 페이지의 '상태'를 문자열로 정의
type ModalState = 'hidden' | 'login' | 'signup' | 'my-page';

// TypeScript: 메인 페이지의 식단 입력 타입을 정의
type MealInputType = 'text' | 'photo';

// TypeScript: 혈당 상태를 정의
type GlucoseStatus = 'normal' | 'pre-diabetic' | 'danger';

// TypeScript: 예측 기록 데이터의 형식을 정의
type PredictionRecord = {
  date: string; // X축 (예: "11/06 14:30")
  value: number; // Y축 (예: 146)
};

// --- [로그인 자동채우기] ---
// 로그인한 사용자의 정보 타입을 정의
type UserInfo = {
  gender: 'male' | 'female';
  birthYear: string;
  height: string;
  weight: string;
};
// ---

/**
 * [0] 혈당 상태 그래프 컴포넌트 (메인 페이지용)
 */
const GlucoseStatusGraph = ({ value, status }: { value: number; status: GlucoseStatus | null }) => {
  if (!status) return null; // 상태가 null이면 그래프를 그리지 않음

  // 그래프 상의 화살표 위치를 계산하는 함수
  const getIndicatorPosition = () => {
    const min = 80; // 그래프의 최소값
    const max = 250; // 그래프의 최대값
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
      <p className={`status-text ${currentStatus.className}`}>
        {currentStatus.text}
      </p>
    </div>
  );
};


/**
 * [1] 로그인 페이지 컴포넌트
 */
const LoginPage = ({ onPageChange, onLoginSuccess }: {
  onPageChange: (page: ModalState) => void;
  onLoginSuccess: () => void;
}) => {
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const handleLogin = () => {
    // TODO: 백엔드 로그인 API (POST /api/v1/auth/login) 호출
    console.log('로그인 시도:', { loginId, loginPw });
    // 가짜 로그인 성공
    alert('로그인 성공! (임시)');
    onLoginSuccess(); // App.tsx의 로그인 성공 처리 함수 호출
  };

  return (
    <>
      <h1>로그인</h1>
      <div className="input-group">
        <label htmlFor="loginId">ID</label>
        <input
          id="loginId"
          type="text"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="아이디를 입력하세요"
        />
      </div>
      <div className="input-group">
        <label htmlFor="loginPw">PW</label>
        <input
          id="loginPw"
          type="password"
          value={loginPw}
          onChange={(e) => setLoginPw(e.target.value)}
          placeholder="비밀번호를 입력하세요"
        />
      </div>
      <button className="auth-button" onClick={handleLogin}>
        로그인하기
      </button>
      <div className="auth-links">
        <a href="#" onClick={(e) => { e.preventDefault(); alert('아이디 찾기 기능'); }}>
          아이디 찾기
        </a>
        <span>|</span>
        <a href="#" onClick={(e) => { e.preventDefault(); alert('비밀번호 찾기 기능'); }}>
          비밀번호 찾기
        </a>
      </div>
      <div className="auth-switch">
        <span>계정이 없으신가요? </span>
        <a href="#" onClick={(e) => { e.preventDefault(); onPageChange('signup'); }}>
          회원가입
        </a>
      </div>
    </>
  );
};

/**
 * [2] 회원가입 페이지 컴포넌트
 */
const SignupPage = ({ onPageChange }: { onPageChange: (page: ModalState) => void }) => {
  const [signupForm, setSignupForm] = useState({
    name: '',
    gender: 'male',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    height: '',
    weight: '',
    id: '',
    pw: '',
  });

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSignupForm({
      ...signupForm,
      [name]: value,
    });
  };

  // --- [415 오류 수정] ---
  // handleSignup 함수를 JSON 방식으로 수정
  const handleSignup = async () => {
     try{
       // [백엔드 연동] API 주소
       const response = await fetch('https://capcoder-backendauth.onrender.com/api/member/regist.do', {
         method: 'POST',
         headers: {
           // 'Content-Type'을 'application/json'으로 변경
           'Content-Type': 'application/json',
         },
         // body를 'JSON.stringify'를 사용해 JSON 문자열로 변경
         body: JSON.stringify({
           userId: signupForm.id,
           password: signupForm.pw,
           name: signupForm.name,
           gender: signupForm.gender,
           // 백엔드 DTO 필드명에 맞게 'birth'로 보냄
           birth: `${signupForm.birthYear}-${signupForm.birthMonth.padStart(2, '0')}-${signupForm.birthDay.padStart(2, '0')}`,
           height: signupForm.height,
           weight: signupForm.weight,
         }),
       });

       console.log('회원가입 시도 (JSON):', JSON.stringify({
        userId: signupForm.id,
        password: signupForm.pw,
        name: signupForm.name,
        gender: signupForm.gender,
        birth: `${signupForm.birthYear}-${signupForm.birthMonth.padStart(2, '0')}-${signupForm.birthDay.padStart(2, '0')}`,
        height: signupForm.height,
        weight: signupForm.weight,
      }));

       if (response.ok) {
         alert('회원가입 성공!');
         onPageChange('login'); // 회원가입 성공 시 로그인 페이지로 이동
       } else {
         // 백엔드에서 보낸 구체적인 오류 메시지 확인 (선택 사항)
         const errorData = await response.json().catch(() => null);
         console.error('서버 응답 오류:', response.status, errorData);
         alert(`회원가입 실패. (서버 오류: ${response.status})`);
       }
     } catch (error){
       console.error('회원가입 네트워크 오류:', error);
       alert('회원가입 중 오류가 발생했습니다.');
     }
  };
  // --- [415 오류 수정 끝] ---

  return (
    <>
      <h1>회원가입</h1>
      
      {/* (회원가입 폼은 이전과 동일) */}
      <div className="input-group">
        <label htmlFor="name">이름</label>
        <input name="name" type="text" value={signupForm.name} onChange={handleSignupChange} />
      </div>
      <div className="input-group">
        <label>성별</label>
        <div className="radio-group">
          <label>
            <input type="radio" name="gender" value="male" checked={signupForm.gender === 'male'} onChange={handleSignupChange} /> 남
          </label>
          <label>
            <input type="radio" name="gender" value="female" checked={signupForm.gender === 'female'} onChange={handleSignupChange} /> 여
          </label>
        </div>
      </div>
      <div className="input-group">
        <label>생년월일</label>
        <div className="birth-group">
          <input name="birthYear" type="number" placeholder="YYYY" value={signupForm.birthYear} onChange={handleSignupChange} />
          <input name="birthMonth" type="number" placeholder="MM" value={signupForm.birthMonth} onChange={handleSignupChange} />
          <input name="birthDay" type="number" placeholder="DD" value={signupForm.birthDay} onChange={handleSignupChange} />
        </div>
      </div>
      <div className="input-group">
        <label htmlFor="height">키 (cm)</label>
        <input name="height" type="number" value={signupForm.height} onChange={handleSignupChange} />
      </div>
      <div className="input-group">
        <label htmlFor="weight">체중 (kg)</label>
        <input name="weight" type="number" value={signupForm.weight} onChange={handleSignupChange} />
      </div>
      <div className="input-group">
        <label htmlFor="id">ID</label>
        <input name="id" type="text" value={signupForm.id} onChange={handleSignupChange} />
      </div>
      <div className="input-group">
        <label htmlFor="pw">PW</label>
        <input name="pw" type="password" value={signupForm.pw} onChange={handleSignupChange} />
      </div>
      <button className="auth-button" onClick={handleSignup}>
        가입하기
      </button>
      <div className="auth-switch">
        <span>이미 계정이 있으신가요? </span>
        <a href="#" onClick={(e) => { e.preventDefault(); onPageChange('login'); }}>
          로그인
        </a>
      </div>
    </>
  );
};

/**
 * [3] 마이페이지 (꺾은선 그래프가 *빠진* 버전)
 */
const MyPage = ({ onLogout }: {
  onLogout: () => void;
}) => {
  return (
    <>
      <h1>마이 페이지</h1>
      <p>계정 관리 및 로그아웃을 할 수 있습니다.</p>
      
      {/* TODO: 여기에 나중에 프로필 수정 폼 등을 추가할 수 있습니다. */}

      <button className="auth-button logout-button" onClick={onLogout}>
        로그아웃
      </button>
    </>
  );
};


/**
 * [4] 메인 예측 페이지 컴포넌트
 */
// --- [로그인 자동채우기] ---
// onNewPrediction, isLoggedIn, history, userInfo를 props로 받음
const MainPage = ({ onNewPrediction, isLoggedIn, history, userInfo }: {
  onNewPrediction: (record: PredictionRecord) => void;
  isLoggedIn: boolean;
  history: PredictionRecord[];
  userInfo: UserInfo | null; // 로그인한 유저 정보
}) => {
  // ---

  const [formData, setFormData] = useState({
    gender: 'male',
    height: '',
    weight: '',
    birthYear: '',
    mealText: '',
  });
  const [mealInputType, setMealInputType] = useState<MealInputType>('text');
  const [mealFile, setMealFile] = useState<File | null>(null);
  const [predictedGlucose, setPredictedGlucose] = useState<number | null>(null);
  const [glucoseStatus, setGlucoseStatus] = useState<GlucoseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- [로그인 자동채우기] ---
  // userInfo prop이 변경될 때마다(로그인/로그아웃 시) 폼 데이터를 업데이트
  useEffect(() => {
    if (userInfo) {
      // 로그인 시: 유저 정보로 폼을 채움
      setFormData(prev => ({
        ...prev, // mealText 등 기존에 입력 중이던 값은 유지
        gender: userInfo.gender,
        height: userInfo.height,
        weight: userInfo.weight,
        birthYear: userInfo.birthYear,
      }));
    } else {
      // 로그아웃 시: 폼을 초기값으로 리셋
      setFormData({
        gender: 'male',
        height: '',
        weight: '',
        birthYear: '',
        mealText: '',
      });
    }
  }, [userInfo]); // userInfo가 바뀔 때만 이 효과를 실행
  // ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMealFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    setIsLoading(true);
    setPredictedGlucose(null);
    setGlucoseStatus(null); 

    const apiFormData = new FormData();
    // ... (폼 데이터 append 로직은 동일)
    apiFormData.append('gender', formData.gender);
    apiFormData.append('height', formData.height);
    apiFormData.append('weight', formData.weight);
    apiFormData.append('birthYear', formData.birthYear);
    if (mealInputType === 'text') apiFormData.append('mealText', formData.mealText);
    else if (mealFile) apiFormData.append('mealPhoto', mealFile);

    console.log('예측 요청 데이터:', Object.fromEntries(apiFormData.entries()));

    setTimeout(() => {
      const randomGlucose = Math.floor(Math.random() * 121) + 100;
      setPredictedGlucose(randomGlucose);

      let currentStatus: GlucoseStatus = 'normal';
      if (randomGlucose <= 140) {
        currentStatus = 'normal';
      } else if (randomGlucose <= 199) {
        currentStatus = 'pre-diabetic';
      } else {
        currentStatus = 'danger';
      }
      setGlucoseStatus(currentStatus);
      
      // [그래프 추가] 예측 완료 시, App.tsx의 상태(History)를 업데이트
      const now = new Date();
      const newRecord: PredictionRecord = {
        date: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        value: randomGlucose,
      };
      onNewPrediction(newRecord); // 부모 컴포넌트로 새 기록 전달

      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="main-container">
      <h1>혈당 예측</h1>
      
      {/* (입력 폼 UI는 이전과 동일) */}
      {/* [로그인 자동채우기] value가 formData 상태를 따르므로 자동으로 채워짐 */}
      <div className="input-group">
        <label>성별</label>
        <div className="radio-group">
          <label>
            <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleInputChange} /> 남
          </label>
          <label>
            <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleInputChange} /> 여
          </label>
        </div>
      </div>
      <div className="input-group">
        <label htmlFor="birthYear">태어난 연도</label>
        <input name="birthYear" type="number" placeholder="YYYY" value={formData.birthYear} onChange={handleInputChange} />
      </div>
      <div className="input-group">
        <label htmlFor="height">키 (cm)</label>
        <input name="height" type="number" placeholder="예: 170" value={formData.height} onChange={handleInputChange} />
      </div>
      <div className="input-group">
        <label htmlFor="weight">체중 (kg)</label>
        <input name="weight" type="number" placeholder="예: 65" value={formData.weight} onChange={handleInputChange} />
      </div>
      <div className="input-group">
        <label>식단 (사진 또는 직접 입력)</label>
        <div className="meal-input-group">
          <button
            className={mealInputType === 'text' ? 'active' : ''}
            onClick={() => setMealInputType('text')}
          >
            직접 입력
          </button>
          <button
            className={mealInputType === 'photo' ? 'active' : ''}
            onClick={() => setMealInputType('photo')}
          >
            사진 첨부
          </button>
        </div>
        {mealInputType === 'text' ? (
          <input
            name="mealText"
            type="text"
            placeholder="예: 백미밥, 닭가슴살 샐러드"
            value={formData.mealText}
            onChange={handleInputChange}
            style={{ marginTop: '1rem' }}
          />
        ) : (
          <input
            name="mealPhoto"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ marginTop: '1rem' }}
          />
        )}
      </div>

      <button className="predict-button" onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? '예측 중...' : '예측하기'}
      </button>

      {/* --- 결과 표시 영역 --- */}
      <div className="result-container">
        <h2>예상 식후 2시간 혈당</h2>
        {isLoading ? (
          <p className="result-placeholder">데이터를 분석 중입니다...</p>
        ) : predictedGlucose && glucoseStatus ? (
          <>
            <p className="result-value">
              {predictedGlucose} <span>mg/dL</span>
            </p>
            <GlucoseStatusGraph value={predictedGlucose} status={glucoseStatus} />
          </>
        ) : (
          <p className="result-placeholder">정보를 입력하고 버튼을 눌러주세요.</p>
        )}
      </div>

      {/* --- 꺾은선 그래프 섹션 --- */}
      {isLoggedIn && history.length > 0 && (
        <div className="history-chart-container">
          <h2>나의 혈당 예측 기록</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={history}
                margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis domain={[80, 250]} fontSize={12} />
                <Tooltip />
                <Legend />
                <ReferenceLine y={140} label="정상" stroke="green" strokeDasharray="3 3" />
                <ReferenceLine y={200} label="주의" stroke="red" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="예측 혈당" 
                  stroke="#007aff" 
                  strokeWidth={2} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};


/**
 * [5] 인증 모달 컴포넌트
 */
const AuthModal = ({ modalPage, onPageChange, onClose, onLoginSuccess, onLogout }: {
  modalPage: ModalState;
  onPageChange: (page: ModalState) => void;
  onClose: () => void;
  onLoginSuccess: () => void; // 로그인 성공 시
  onLogout: () => void; // 로그아웃 시
}) => {
  if (modalPage === 'hidden') {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        
        {modalPage === 'login' && <LoginPage onPageChange={onPageChange} onLoginSuccess={onLoginSuccess} />}
        {modalPage === 'signup' && <SignupPage onPageChange={onPageChange} />}
        {modalPage === 'my-page' && <MyPage onLogout={onLogout} />}
      </div>
    </div>
  );
};

/**
 * [6] 플로팅 버튼 컴포넌트
 */
const FloatingAuthButton = ({ isLoggedIn, onClick }: {
  isLoggedIn: boolean;
  onClick: () => void;
}) => {
  return (
    <button 
      className="floating-auth-button" 
      onClick={onClick} 
      title={isLoggedIn ? "마이페이지" : "로그인 / 회원가입"}
    >
      {'👤'}
    </button>
  );
};

/**
 * [App] 메인 앱 컴포넌트
 */
function App() {
  // --- 상태 관리 ---
  const [modalPage, setModalPage] = useState<ModalState>('hidden');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태
  const [predictionHistory, setPredictionHistory] = useState<PredictionRecord[]>([]); // 예측 기록
  
  // --- [로그인 자동채우기] ---
  // 로그인한 유저의 정보를 저장할 상태
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null);
  // ---

  // --- 핸들러 함수 ---
  
  // 플로팅 버튼 클릭 시
  const handleOpenModal = () => {
    if (isLoggedIn) {
      setModalPage('my-page'); // 로그인 O -> 마이페이지 열기
    } else {
      setModalPage('login'); // 로그인 X -> 로그인 페이지 열기
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setModalPage('hidden');
  };

  // 로그인 성공 시 (LoginPage에서 호출)
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setModalPage('hidden'); // 모달 닫기

    // --- [로그인 자동채우기] ---
    // TODO: 원래는 백엔드 로그인 API 응답으로 받은 유저 정보를 저장해야 합니다.
    // (지금은 가짜 데이터(하드코딩)로 유저 정보를 설정합니다.)
    const fakeUserInfo: UserInfo = {
      gender: 'female',
      birthYear: '1995',
      height: '165',
      weight: '55',
    };
    setCurrentUserInfo(fakeUserInfo);
    // ---

    // TODO: 로그인 성공 시, 백엔드에서 이 유저의 과거 예측 기록을 불러와
    // setPredictionHistory(...)에 채워넣어야 합니다.
    setPredictionHistory([
      { date: '10:00', value: 120 },
      { date: '14:30', value: 155 },
      { date: '19:15', value: 130 },
    ]);
  };

  // 로그아웃 시 (MyPage에서 호출)
  const handleLogout = () => {
    setIsLoggedIn(false);
    setModalPage('hidden'); // 모달 닫기
    setPredictionHistory([]); // 기록 초기화
    
    // --- [로그인 자동채우기] ---
    // 로그아웃 시 유저 정보와 폼을 리셋합니다.
    setCurrentUserInfo(null);
    // ---
    
    alert('로그아웃되었습니다.');
  };

  // 새 예측 발생 시 (MainPage에서 호출)
  const handleNewPrediction = (newRecord: PredictionRecord) => {
    // 로그인 상태일 때만 기록을 저장합니다.
    if (isLoggedIn) {
      setPredictionHistory(prevHistory => [...prevHistory, newRecord]);
      // TODO: 이 새 기록(newRecord)을 백엔드 DB에도 저장해야 합니다.
      // (POST /api/v1/predictions)
    }
  };

  return (
    <div className="App">
      {/* [로그인 자동채우기] 
        MainPage에 로그인 상태(isLoggedIn), 기록(history),
        새 예측 핸들러(onNewPrediction), 
        그리고 '로그인한 유저 정보(userInfo)'를 props로 전달 
      */}
      <MainPage 
        onNewPrediction={handleNewPrediction} 
        isLoggedIn={isLoggedIn}
        history={predictionHistory}
        userInfo={currentUserInfo}
      />

      {/* 플로팅 버튼 (isLoggedIn 상태를 props로 전달) */}
      <FloatingAuthButton isLoggedIn={isLoggedIn} onClick={handleOpenModal} />
      
      {/* 인증 모달 (모든 상태와 핸들러를 props로 전달) */}
      <AuthModal
        modalPage={modalPage}
        onPageChange={setModalPage}
        onClose={handleCloseModal}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;