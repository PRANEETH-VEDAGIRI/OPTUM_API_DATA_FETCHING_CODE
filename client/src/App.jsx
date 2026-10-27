import { useState } from 'react';
import axios from 'axios';
import EligibilityForm from './components/EligibilityForm';
import EligibilityResult from './components/EligibilityResult';

const API_URL = 'http://127.0.0.1:8888';

function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (payload) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/eligibility`, payload);
      setResult(response.data);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'An error occurred';
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-icon">E</div>
        <h1>Eligibility Verification</h1>
        <span className="subtitle">Optum Healthcare API • Sandbox</span>
      </header>

      <main className="main-content">
        <EligibilityForm onSubmit={handleSubmit} isLoading={isLoading} />
        <EligibilityResult data={result} error={error} />
      </main>
    </div>
  );
}

export default App;
