"""
JSON API endpoints for the React frontend.
These endpoints return structured JSON data that the Pager TMA frontend can consume.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta

from watchtower.core.database import get_db
from watchtower.core.models import (
    MonitorTarget, EndpointCheckResult, Incident, IncidentEvent,
    AlertDelivery, FrontendErrorEvent, BackendErrorEvent
)
from watchtower.core.enums import IncidentState

router = APIRouter(prefix="/api", tags=["json-api"])


def _serialize_datetime(dt):
    """Safely serialize a datetime to ISO format."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


# ── Dashboard Summary ──
@router.get("/dashboard")
async def api_dashboard(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(hours=1)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    targets = db.query(MonitorTarget).all()

    # Endpoint stats
    up_count = 0
    down_count = 0
    total_response_time = 0
    response_count = 0
    endpoints_summary = []

    for target in targets:
        latest_check = (
            db.query(EndpointCheckResult)
            .filter(EndpointCheckResult.target_id == target.id)
            .order_by(EndpointCheckResult.checked_at.desc())
            .first()
        )
        status = "UNKNOWN"
        response_time = None
        last_checked = None
        status_code = None

        if latest_check:
            status = latest_check.status
            response_time = latest_check.response_ms
            last_checked = _serialize_datetime(latest_check.checked_at)
            status_code = latest_check.http_code
            if status == "UP":
                up_count += 1
            else:
                down_count += 1
            if response_time:
                total_response_time += response_time
                response_count += 1

        endpoints_summary.append({
            "id": target.id,
            "name": target.name,
            "url": target.url,
            "method": target.method,
            "status": status,
            "statusCode": status_code,
            "responseTime": round(response_time) if response_time else None,
            "lastChecked": last_checked,
            "enabled": target.enabled,
        })

    # Error counts
    frontend_error_count = db.query(FrontendErrorEvent).filter(
        FrontendErrorEvent.received_at >= one_hour_ago
    ).count()
    backend_error_count = db.query(BackendErrorEvent).filter(
        BackendErrorEvent.occurred_at >= one_hour_ago
    ).count()

    # Incident counts
    open_incidents = db.query(Incident).filter(Incident.state == IncidentState.OPEN).count()
    resolved_today = db.query(Incident).filter(
        Incident.state == IncidentState.RESOLVED,
        Incident.resolved_at >= today_start
    ).count()

    # Alert count
    alerts_today = db.query(AlertDelivery).filter(
        AlertDelivery.sent_at >= today_start
    ).count()

    return {
        "endpoints": {
            "total": len(targets),
            "up": up_count,
            "down": down_count,
            "avgResponseTime": round(total_response_time / response_count) if response_count > 0 else 0,
        },
        "errors": {
            "frontend": frontend_error_count,
            "backend": backend_error_count,
            "total": frontend_error_count + backend_error_count,
        },
        "incidents": {
            "open": open_incidents,
            "resolvedToday": resolved_today,
        },
        "alerts": {
            "sentToday": alerts_today,
        },
        "endpointsSummary": endpoints_summary,
    }


# ── Endpoints ──
@router.get("/endpoints")
async def api_endpoints(db: Session = Depends(get_db)):
    targets = db.query(MonitorTarget).all()
    result = []

    for target in targets:
        # Get latest check
        latest_check = (
            db.query(EndpointCheckResult)
            .filter(EndpointCheckResult.target_id == target.id)
            .order_by(EndpointCheckResult.checked_at.desc())
            .first()
        )

        # Get last 24 check results for sparkline
        checks_24h = (
            db.query(EndpointCheckResult)
            .filter(EndpointCheckResult.target_id == target.id)
            .order_by(EndpointCheckResult.checked_at.desc())
            .limit(24)
            .all()
        )
        checks_24h.reverse()

        check_history = []
        up_checks = 0
        total_checks = len(checks_24h)
        for check in checks_24h:
            if check.status == "UP":
                up_checks += 1
            check_history.append({
                "time": _serialize_datetime(check.checked_at),
                "responseTime": round(check.response_ms) if check.response_ms else None,
                "status": check.status,
                "statusCode": check.http_code,
            })

        uptime_percent = round((up_checks / total_checks * 100), 2) if total_checks > 0 else 100.0

        status = "UNKNOWN"
        response_time = None
        last_checked = None
        status_code = None
        error_msg = None

        if latest_check:
            status = latest_check.status
            response_time = round(latest_check.response_ms) if latest_check.response_ms else None
            last_checked = _serialize_datetime(latest_check.checked_at)
            status_code = latest_check.http_code
            if latest_check.error_class:
                error_msg = latest_check.error_class

        result.append({
            "id": f"ep_{target.id:03d}",
            "dbId": target.id,
            "name": target.name,
            "url": target.url,
            "method": target.method,
            "status": status,
            "statusCode": status_code,
            "responseTime": response_time,
            "lastChecked": last_checked,
            "category": "backend" if "/api" in target.url or "/health" in target.url else "frontend",
            "uptimePercent": uptime_percent,
            "checkHistory": check_history,
            "error": error_msg,
            "enabled": target.enabled,
        })

    return result


@router.get("/endpoints/{endpoint_id}")
async def api_endpoint_detail(endpoint_id: int, db: Session = Depends(get_db)):
    target = db.query(MonitorTarget).filter(MonitorTarget.id == endpoint_id).first()
    if not target:
        return JSONResponse(status_code=404, content={"detail": "Endpoint not found"})

    # Get last 100 checks
    checks = (
        db.query(EndpointCheckResult)
        .filter(EndpointCheckResult.target_id == target.id)
        .order_by(EndpointCheckResult.checked_at.desc())
        .limit(100)
        .all()
    )
    checks.reverse()

    check_history = []
    up_checks = 0
    for check in checks:
        if check.status == "UP":
            up_checks += 1
        check_history.append({
            "time": _serialize_datetime(check.checked_at),
            "responseTime": round(check.response_ms) if check.response_ms else None,
            "status": check.status,
            "statusCode": check.http_code,
            "errorClass": check.error_class,
        })

    uptime_percent = round((up_checks / len(checks) * 100), 2) if len(checks) > 0 else 100.0

    latest = checks[-1] if checks else None

    return {
        "id": f"ep_{target.id:03d}",
        "dbId": target.id,
        "name": target.name,
        "url": target.url,
        "method": target.method,
        "status": latest.status if latest else "UNKNOWN",
        "statusCode": latest.http_code if latest else None,
        "responseTime": round(latest.response_ms) if latest and latest.response_ms else None,
        "lastChecked": _serialize_datetime(latest.checked_at) if latest else None,
        "uptimePercent": uptime_percent,
        "checkHistory": check_history,
        "error": latest.error_class if latest else None,
        "enabled": target.enabled,
        "createdAt": _serialize_datetime(target.created_at),
    }


# ── Incidents ──
@router.get("/incidents")
async def api_incidents(db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.last_seen.desc()).limit(50).all()
    result = []

    for inc in incidents:
        events = (
            db.query(IncidentEvent)
            .filter(IncidentEvent.incident_id == inc.id)
            .order_by(IncidentEvent.occurred_at.asc())
            .all()
        )
        timeline = []
        for ev in events:
            detail = ev.detail_json or {}
            timeline.append({
                "time": _serialize_datetime(ev.occurred_at),
                "event": detail.get("message", ev.event_type),
                "type": "error" if ev.event_type == "OPENED" else (
                    "recovery" if ev.event_type == "RESOLVED" else "state"
                ),
            })

        severity_map = {
            "CRITICAL": "critical",
            "HIGH": "critical",
            "WARNING": "warning",
            "INFO": "info",
        }

        result.append({
            "id": f"inc_{inc.id:03d}",
            "dbId": inc.id,
            "title": inc.title,
            "state": inc.state,
            "severity": severity_map.get(inc.severity, "info"),
            "sourceType": inc.source_type.lower() if inc.source_type else "unknown",
            "component": inc.source_id or "unknown",
            "fingerprint": inc.key,
            "firstSeen": _serialize_datetime(inc.first_seen),
            "lastSeen": _serialize_datetime(inc.last_seen),
            "resolvedAt": _serialize_datetime(inc.resolved_at),
            "eventCount": len(events),
            "description": inc.title,
            "timeline": timeline,
            "linkedSignals": [inc.source_type.lower()] if inc.source_type else [],
            "linkedEndpoints": [],
            "linkedBackendErrors": [],
            "linkedFrontendErrors": [],
        })

    return result


@router.get("/incidents/{incident_id}")
async def api_incident_detail(incident_id: int, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        return JSONResponse(status_code=404, content={"detail": "Incident not found"})

    events = (
        db.query(IncidentEvent)
        .filter(IncidentEvent.incident_id == inc.id)
        .order_by(IncidentEvent.occurred_at.asc())
        .all()
    )
    timeline = []
    for ev in events:
        detail = ev.detail_json or {}
        timeline.append({
            "time": _serialize_datetime(ev.occurred_at),
            "event": detail.get("message", ev.event_type),
            "type": "error" if ev.event_type == "OPENED" else (
                "recovery" if ev.event_type == "RESOLVED" else "state"
            ),
        })

    deliveries = (
        db.query(AlertDelivery)
        .filter(AlertDelivery.incident_id == inc.id)
        .order_by(AlertDelivery.sent_at.desc())
        .all()
    )

    severity_map = {"CRITICAL": "critical", "HIGH": "critical", "WARNING": "warning", "INFO": "info"}

    return {
        "id": f"inc_{inc.id:03d}",
        "dbId": inc.id,
        "title": inc.title,
        "state": inc.state,
        "severity": severity_map.get(inc.severity, "info"),
        "sourceType": inc.source_type.lower() if inc.source_type else "unknown",
        "component": inc.source_id or "unknown",
        "fingerprint": inc.key,
        "firstSeen": _serialize_datetime(inc.first_seen),
        "lastSeen": _serialize_datetime(inc.last_seen),
        "resolvedAt": _serialize_datetime(inc.resolved_at),
        "eventCount": len(events),
        "description": inc.title,
        "timeline": timeline,
        "deliveries": [
            {
                "id": f"ad_{d.id:03d}",
                "type": d.alert_type.lower(),
                "recipient": d.recipient,
                "sentAt": _serialize_datetime(d.sent_at),
                "success": d.success,
            }
            for d in deliveries
        ],
    }


# ── Backend Errors ──
@router.get("/errors/backend")
async def api_backend_errors(db: Session = Depends(get_db)):
    errors = db.query(BackendErrorEvent).order_by(
        BackendErrorEvent.occurred_at.desc()
    ).limit(100).all()

    # Group by fingerprint for counts
    fingerprint_counts = {}
    fingerprint_first_seen = {}
    for err in errors:
        fp = err.fingerprint
        fingerprint_counts[fp] = fingerprint_counts.get(fp, 0) + 1
        if fp not in fingerprint_first_seen:
            fingerprint_first_seen[fp] = err.occurred_at

    # Deduplicate by fingerprint, keeping latest
    seen = set()
    result = []
    for err in errors:
        if err.fingerprint in seen:
            continue
        seen.add(err.fingerprint)
        result.append({
            "id": f"be_{err.id:03d}",
            "source": "backend_log",
            "service": err.service_name,
            "errorClass": err.error_type,
            "message": err.message,
            "fingerprint": err.fingerprint,
            "severity": "critical" if fingerprint_counts.get(err.fingerprint, 0) > 10 else "warning",
            "count": fingerprint_counts.get(err.fingerprint, 1),
            "firstSeen": _serialize_datetime(fingerprint_first_seen.get(err.fingerprint)),
            "lastSeen": _serialize_datetime(err.occurred_at),
            "stackPreview": err.stack or err.raw_line or "",
            "logSource": err.source_file,
        })

    return result


# ── Frontend Errors ──
@router.get("/errors/frontend")
async def api_frontend_errors(db: Session = Depends(get_db)):
    errors = db.query(FrontendErrorEvent).order_by(
        FrontendErrorEvent.received_at.desc()
    ).limit(100).all()

    # Group by app_id + error_type for counts
    group_counts = {}
    group_first_seen = {}
    for err in errors:
        key = f"{err.app_id}::{err.error_type}"
        group_counts[key] = group_counts.get(key, 0) + 1
        if key not in group_first_seen:
            group_first_seen[key] = err.received_at

    seen = set()
    result = []
    for err in errors:
        key = f"{err.app_id}::{err.error_type}"
        if key in seen:
            continue
        seen.add(key)
        result.append({
            "id": f"fe_{err.id:03d}",
            "source": "frontend_runtime",
            "app": err.app_id,
            "environment": err.environment or "production",
            "releaseVersion": err.release_version or "unknown",
            "errorType": err.error_type,
            "message": err.message,
            "url": err.url,
            "userAgent": err.user_agent,
            "stack": err.stack or "",
            "count": group_counts.get(key, 1),
            "firstSeen": _serialize_datetime(group_first_seen.get(key)),
            "lastSeen": _serialize_datetime(err.received_at),
            "severity": "critical" if group_counts.get(key, 0) > 20 else "warning",
            "fingerprint": key,
        })

    return result


# ── Alert Deliveries ──
@router.get("/alerts")
async def api_alerts(db: Session = Depends(get_db)):
    deliveries = db.query(AlertDelivery).order_by(
        AlertDelivery.sent_at.desc()
    ).limit(50).all()

    result = []
    for d in deliveries:
        inc = db.query(Incident).filter(Incident.id == d.incident_id).first()
        result.append({
            "id": f"ad_{d.id:03d}",
            "incidentId": f"inc_{d.incident_id:03d}" if d.incident_id else None,
            "incidentTitle": inc.title if inc else "Unknown Incident",
            "type": d.alert_type.lower() if d.alert_type else "failure",
            "sentAt": _serialize_datetime(d.sent_at),
            "recipient": d.recipient,
            "status": "delivered" if d.success else "failed",
        })

    return result


# ── System Health ──
@router.get("/system-health")
async def api_system_health(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    one_day_ago = now - timedelta(hours=24)

    targets_count = db.query(MonitorTarget).count()
    last_check = db.query(EndpointCheckResult).order_by(
        EndpointCheckResult.checked_at.desc()
    ).first()

    open_incidents = db.query(Incident).filter(
        Incident.state == IncidentState.OPEN
    ).count()
    resolved_today = db.query(Incident).filter(
        Incident.state == IncidentState.RESOLVED,
        Incident.resolved_at >= today_start
    ).count()

    fe_events_24h = db.query(FrontendErrorEvent).filter(
        FrontendErrorEvent.received_at >= one_day_ago
    ).count()

    alerts_today = db.query(AlertDelivery).filter(
        AlertDelivery.sent_at >= today_start
    ).count()
    failed_alerts_today = db.query(AlertDelivery).filter(
        AlertDelivery.sent_at >= today_start,
        AlertDelivery.success == False
    ).count()

    return {
        "endpointChecker": {
            "status": "running",
            "lastRun": _serialize_datetime(last_check.checked_at) if last_check else None,
            "interval": "60s",
            "targetsCount": targets_count,
        },
        "logParser": {
            "status": "running",
            "interval": "300s",
            "sourcesCount": 0,
        },
        "frontendIngestion": {
            "status": "running",
            "eventsLast24h": fe_events_24h,
            "appsConnected": db.query(func.count(func.distinct(FrontendErrorEvent.app_id))).scalar() or 0,
        },
        "incidentEngine": {
            "status": "running",
            "openIncidents": open_incidents,
            "resolvedLast24h": resolved_today,
        },
        "emailNotifier": {
            "status": "running",
            "deliveredLast24h": alerts_today,
            "failedLast24h": failed_alerts_today,
        },
        "version": "2.0.0",
    }
