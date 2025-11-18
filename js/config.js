// Supabase 설정
// GitHub Pages 배포 전에 실제 값으로 변경하세요
const SUPABASE_CONFIG = {
  url: 'https://mhvsyjsucntyhwjgztzl.supabase.co', // 예: https://xxxxx.supabase.co
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odnN5anN1Y250eWh3amd6dHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNTU3MzgsImV4cCI6MjA3ODkzMTczOH0.7E9HMm-rnUO90Iavrrdr1l0xCSfhhh_HzKsu6YMg408'
};

// 환경 설정
const ENV = {
  isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  isProduction: window.location.hostname.includes('github.io')
};




