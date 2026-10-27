function formatDate(dateStr) {
    if (!dateStr || dateStr.length !== 8) return null;
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

function formatCurrency(val) {
    if (val === undefined || val === null || val === '') return null;
    return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatPercent(val) {
    if (val === undefined || val === null || val === '') return null;
    return `${(Number(val) * 100).toFixed(0)}%`;
}

// Only render a row if value is truthy
function InfoRow({ label, value }) {
    if (!value && value !== 0) return null;
    return (
        <div className="info-row">
            <span className="info-row-label">{label}</span>
            <span className="info-row-value">{value}</span>
        </div>
    );
}

// Only render a section if it has at least one child
function Section({ icon, title, badge, children }) {
    const filtered = Array.isArray(children)
        ? children.filter(Boolean)
        : children ? [children] : [];
    if (filtered.length === 0) return null;
    return (
        <div className="card" style={{ animation: 'slideIn 0.4s ease' }}>
            <div className="card-header">
                <div className="icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{icon}</div>
                <h2>{title}</h2>
                {badge && <span className="badge" style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8' }}>{badge}</span>}
            </div>
            {filtered}
        </div>
    );
}

// Extract unique financial items from benefitsInformation
function extractFinancials(benefits) {
    if (!benefits || !Array.isArray(benefits)) return { costShare: [], serviceLimits: [] };

    const costShare = [];
    const serviceLimits = [];

    for (const b of benefits) {
        const code = b.code;
        const level = b.coverageLevel || '';
        const timeQual = b.timeQualifier || '';
        const services = (b.serviceTypes || []).join(', ');

        // Deductible (code C)
        if (code === 'C' && b.benefitAmount) {
            const label = `Deductible${level ? ` (${level})` : ''}${timeQual === 'Remaining' ? ' Remaining' : ''}`;
            costShare.push({ label, value: formatCurrency(b.benefitAmount), services, type: 'deductible' });
        }

        // Co-Insurance (code A)
        if (code === 'A' && b.benefitPercent !== undefined) {
            const label = `Coinsurance${level ? ` (${level})` : ''}`;
            costShare.push({ label, value: formatPercent(b.benefitPercent), services, type: 'coinsurance' });
        }

        // Co-Payment (code B)
        if (code === 'B' && b.benefitAmount) {
            costShare.push({ label: 'Copay', value: formatCurrency(b.benefitAmount), services, type: 'coinsurance' });
        }

        // Limitations with amounts (code F) — Annual Limit, Lifetime Limit
        if (code === 'F' && b.benefitAmount) {
            const period = timeQual || '';
            const label = `${period.includes('Lifetime') ? 'Lifetime' : 'Annual'} Limit${level ? ` (${level})` : ''}${period === 'Remaining' || period === 'Lifetime Remaining' ? ' Remaining' : ''}`;
            costShare.push({ label, value: formatCurrency(b.benefitAmount), services, type: 'limitation' });
        }

        // Out-of-Pocket (code G)
        if (code === 'G' && b.benefitAmount) {
            const label = `Out-of-Pocket${timeQual === 'Remaining' ? ' Remaining' : ' Max'}${level ? ` (${level})` : ''}`;
            costShare.push({ label, value: formatCurrency(b.benefitAmount), services, type: 'limitation' });
        }

        // Service/Visit Limits (from benefitsServiceDelivery)
        if (b.benefitsServiceDelivery && b.benefitsServiceDelivery.length > 0) {
            for (const sd of b.benefitsServiceDelivery) {
                if (sd.quantity) {
                    const unit = sd.quantityQualifier || 'Units';
                    const period = sd.timePeriodQualifier || '';
                    const desc = (b.additionalInformation || []).map(a => a.description).filter(Boolean).join(', ');
                    serviceLimits.push({
                        service: services || desc || 'General',
                        limit: `${sd.quantity} ${unit}`,
                        period: period ? `per ${sd.numOfPeriods || 1} ${period}` : (sd.sampleSelectionModulus ? `per ${sd.sampleSelectionModulus} Months` : ''),
                        description: desc,
                    });
                }
            }
        }
    }

    return { costShare, serviceLimits };
}

function EligibilityResult({ data, error }) {
    if (error) {
        return (
            <div className="error-banner">
                <span className="error-icon">⚠️</span>
                <div className="error-text">
                    <h3>Request Failed</h3>
                    <p>{typeof error === 'string' ? error : error?.detail || 'An unexpected error occurred.'}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="card">
                <div className="results-empty">
                    <div className="empty-icon">🏥</div>
                    <h3>No Results Yet</h3>
                    <p>Fill in the form and click "Check Eligibility" to view coverage details.</p>
                </div>
            </div>
        );
    }

    const statusInfo = data.planStatus?.[0];
    const isActive = statusInfo?.status?.toLowerCase().includes('active');
    const sub = data.subscriber || {};
    const payer = data.payer || {};
    const plan = data.planInformation || {};
    const dates = data.planDateInformation || {};
    const { costShare, serviceLimits } = extractFinancials(data.benefitsInformation);

    return (
        <div className="results-container">
            {/* ===== Coverage Status Banner ===== */}
            {statusInfo && (
                <div className={`status-banner ${isActive ? 'active' : 'inactive'}`}>
                    <div className="status-dot" />
                    <div className="status-text">
                        <h3>{statusInfo.status}</h3>
                        {statusInfo.planDetails && <p>{statusInfo.planDetails}</p>}
                    </div>
                </div>
            )}

            {/* ===== Patient Information ===== */}
            <Section icon="👤" title="Patient Information">
                <div className="info-rows">
                    <InfoRow label="Name" value={[sub.firstName, sub.lastName].filter(Boolean).join(' ') || null} />
                    <InfoRow label="Member ID" value={sub.memberId} />
                    <InfoRow label="Group Number" value={sub.groupNumber || plan.groupNumber} />
                    <InfoRow label="Entity Type" value={sub.entityIdentifier} />
                </div>
            </Section>

            {/* ===== Insurance Plan ===== */}
            <Section icon="📋" title="Insurance Plan">
                <div className="info-rows">
                    <InfoRow label="Plan Name" value={statusInfo?.planDetails} />
                    <InfoRow label="Plan Number" value={plan.planNumber} />
                    <InfoRow label="Group Description" value={plan.groupDescription} />
                    <InfoRow label="Coverage Status" value={statusInfo?.status} />
                    <InfoRow label="Insurance Type" value={
                        (data.benefitsInformation || []).find(b => b.insuranceType)?.insuranceType || null
                    } />
                    <InfoRow label="Plan Coverage" value={
                        (data.benefitsInformation || []).find(b => b.planCoverage)?.planCoverage || null
                    } />
                    <InfoRow label="Payer" value={payer.name} />
                    <InfoRow label="Payer ID" value={payer.payorIdentification} />
                </div>
            </Section>

            {/* ===== Coverage Dates ===== */}
            {(dates.planBegin || dates.eligibilityBegin || dates.service || dates.planEnd) && (
                <Section icon="📅" title="Coverage Dates">
                    <div className="info-rows">
                        <InfoRow label="Plan Start" value={formatDate(dates.planBegin)} />
                        <InfoRow label="Eligibility Start" value={formatDate(dates.eligibilityBegin)} />
                        <InfoRow label="Service Date" value={formatDate(dates.service)} />
                        <InfoRow label="Plan End" value={formatDate(dates.planEnd)} />
                    </div>
                </Section>
            )}

            {/* ===== Cost Share ===== */}
            {costShare.length > 0 && (
                <div className="card" style={{ animation: 'slideIn 0.5s ease' }}>
                    <div className="card-header">
                        <div className="icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>💰</div>
                        <h2>Cost Share</h2>
                        <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                            {costShare.length} items
                        </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="benefits-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Applies To</th>
                                </tr>
                            </thead>
                            <tbody>
                                {costShare.map((item, i) => (
                                    <tr key={i}>
                                        <td>
                                            <span className={`benefit-type-badge ${item.type}`}>{item.label}</span>
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                            {item.value}
                                        </td>
                                        <td>
                                            <div className="service-types-list">
                                                {item.services.split(', ').filter(Boolean).map((s, j) => (
                                                    <span key={j} className="service-type-chip">{s}</span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== Service Limits ===== */}
            {serviceLimits.length > 0 && (
                <div className="card" style={{ animation: 'slideIn 0.6s ease' }}>
                    <div className="card-header">
                        <div className="icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>📊</div>
                        <h2>Service Limits</h2>
                        <span className="badge" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                            {serviceLimits.length} limits
                        </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="benefits-table">
                            <thead>
                                <tr>
                                    <th>Service</th>
                                    <th>Limit</th>
                                    <th>Period</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serviceLimits.map((item, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 500 }}>
                                            <div className="service-types-list">
                                                {item.service.split(', ').filter(Boolean).map((s, j) => (
                                                    <span key={j} className="service-type-chip">{s}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{item.limit}</td>
                                        <td>{item.period}</td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.description || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EligibilityResult;
