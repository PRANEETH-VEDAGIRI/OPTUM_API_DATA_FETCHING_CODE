import { useState } from 'react';

const SERVICE_TYPE_OPTIONS = [
    { code: '30', label: 'Health Benefit Plan Coverage' },
    { code: '98', label: 'Professional (Physician) Visit' },
    { code: '33', label: 'Chiropractic' },
    { code: '23', label: 'Diagnostic Dental' },
    { code: '24', label: 'Periodontics' },
    { code: '25', label: 'Restorative' },
    { code: '26', label: 'Endodontics' },
    { code: '28', label: 'Adjunctive Dental Services' },
    { code: '36', label: 'Dental Crowns' },
    { code: '38', label: 'Orthodontics' },
    { code: '39', label: 'Prosthodontics' },
    { code: '40', label: 'Oral Surgery' },
    { code: '41', label: 'Routine (Preventive) Dental' },
];

function EligibilityForm({ onSubmit, isLoading }) {
    const [form, setForm] = useState({
        controlNumber: '000000050',
        tradingPartnerServiceId: '000048',
        organizationName: 'happy doctors group',
        npi: '1760854442',
        memberId: '1234567890',
        firstName: 'johnone',
        lastName: 'doeone',
        dateOfBirth: '19800101',
        gender: 'M',
    });
    const [serviceCodes, setServiceCodes] = useState(['30', '98', '33']);
    const [codeInput, setCodeInput] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const addCode = (code) => {
        const trimmed = code.trim();
        if (trimmed && !serviceCodes.includes(trimmed)) {
            setServiceCodes([...serviceCodes, trimmed]);
        }
        setCodeInput('');
    };

    const removeCode = (code) => {
        setServiceCodes(serviceCodes.filter((c) => c !== code));
    };

    const handleKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && codeInput.trim()) {
            e.preventDefault();
            addCode(codeInput);
        }
        if (e.key === 'Backspace' && !codeInput && serviceCodes.length > 0) {
            setServiceCodes(serviceCodes.slice(0, -1));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            controlNumber: form.controlNumber,
            tradingPartnerServiceId: form.tradingPartnerServiceId,
            provider: {
                organizationName: form.organizationName,
                npi: form.npi,
            },
            subscriber: {
                memberId: form.memberId,
                firstName: form.firstName,
                lastName: form.lastName,
                dateOfBirth: form.dateOfBirth,
                gender: form.gender,
            },
            serviceTypeCodes: serviceCodes,
        };
        onSubmit(payload);
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className="icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>📋</div>
                <h2>Eligibility Check</h2>
                <span className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>v3</span>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Control Info */}
                <div className="form-section">
                    <div className="form-section-title">Control Information</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Control Number</label>
                            <input name="controlNumber" value={form.controlNumber} onChange={handleChange} placeholder="000000050" />
                        </div>
                        <div className="form-group">
                            <label>Trading Partner ID</label>
                            <input name="tradingPartnerServiceId" value={form.tradingPartnerServiceId} onChange={handleChange} placeholder="000048" />
                        </div>
                    </div>
                </div>

                {/* Provider */}
                <div className="form-section">
                    <div className="form-section-title">Provider Information</div>
                    <div className="form-group">
                        <label>Organization Name</label>
                        <input name="organizationName" value={form.organizationName} onChange={handleChange} placeholder="Organization Name" />
                    </div>
                    <div className="form-group">
                        <label>NPI</label>
                        <input name="npi" value={form.npi} onChange={handleChange} placeholder="NPI Number" />
                    </div>
                </div>

                {/* Subscriber */}
                <div className="form-section">
                    <div className="form-section-title">Subscriber Information</div>
                    <div className="form-group">
                        <label>Member ID</label>
                        <input name="memberId" value={form.memberId} onChange={handleChange} placeholder="Member ID" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Date of Birth (YYYYMMDD)</label>
                            <input name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} placeholder="19800101" />
                        </div>
                        <div className="form-group">
                            <label>Gender</label>
                            <select name="gender" value={form.gender} onChange={handleChange}>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                                <option value="U">Unknown</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Service Type Codes */}
                <div className="form-section">
                    <div className="form-section-title">Service Type Codes</div>
                    <div className="service-codes-input">
                        {serviceCodes.map((code) => {
                            const opt = SERVICE_TYPE_OPTIONS.find(o => o.code === code);
                            return (
                                <span key={code} className="service-code-tag">
                                    {code}{opt ? ` - ${opt.label}` : ''}
                                    <button type="button" onClick={() => removeCode(code)}>×</button>
                                </span>
                            );
                        })}
                        <input
                            value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={serviceCodes.length === 0 ? 'Type code & press Enter...' : ''}
                        />
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {SERVICE_TYPE_OPTIONS.filter(o => !serviceCodes.includes(o.code)).slice(0, 6).map(opt => (
                            <button
                                key={opt.code}
                                type="button"
                                onClick={() => addCode(opt.code)}
                                style={{
                                    padding: '3px 8px', fontSize: '11px', background: 'rgba(99,102,241,0.06)',
                                    border: '1px solid rgba(99,102,241,0.15)', borderRadius: '4px',
                                    color: '#94a3b8', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                + {opt.code}
                            </button>
                        ))}
                    </div>
                </div>

                <button type="submit" className="submit-btn" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <div className="spinner" />
                            Checking Eligibility...
                        </>
                    ) : (
                        <>🔍 Check Eligibility</>
                    )}
                </button>
            </form>
        </div>
    );
}

export default EligibilityForm;
