import nodemailer from "nodemailer";

// 네이버 SMTP 설정
const transporter = nodemailer.createTransport({
  host: "smtp.naver.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

// 기본 이메일 발송 함수
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("[Email] 이메일 설정이 없습니다. 발송 건너뜀.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"계룡대학습관 시설예약" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] 발송 성공: ${to}`);
    return true;
  } catch (error) {
    console.error("[Email] 발송 실패:", error);
    return false;
  }
}

// 예약 신청 확인 이메일
export async function sendReservationConfirmation(data: {
  to: string;
  name: string;
  facilityName: string;
  startAt: string;
  endAt: string;
  purpose: string;
  qrCode?: string;
}): Promise<boolean> {
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #3b82f6; }
        .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .info-label { color: #6b7280; width: 100px; }
        .info-value { color: #111827; font-weight: 500; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 13px; }
        .qr-box { text-align: center; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">🏢 시설 예약 신청 완료</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">계룡대학습관 시설예약 시스템</p>
        </div>
        
        <div class="content">
          <p>안녕하세요, <strong>${data.name}</strong>님!</p>
          <p>시설 예약 신청이 정상적으로 접수되었습니다.</p>
          
          <div class="info-box">
            <h3 style="margin: 0 0 15px 0; color: #374151;">📋 예약 정보</h3>
            <div class="info-row">
              <span class="info-label">시설명</span>
              <span class="info-value">${data.facilityName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">시작 시간</span>
              <span class="info-value">${formatDateTime(data.startAt)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">종료 시간</span>
              <span class="info-value">${formatDateTime(data.endAt)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">사용 목적</span>
              <span class="info-value">${data.purpose}</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="info-label">상태</span>
              <span class="status status-pending">승인 대기중</span>
            </div>
          </div>

          ${data.qrCode ? `
          <div class="qr-box">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">체크인 코드</p>
            <div style="font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #3b82f6;">${data.qrCode}</div>
            <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 13px;">예약 승인 후 이 코드로 체크인하세요</p>
          </div>
          ` : ''}

          <p style="color: #6b7280; font-size: 14px;">
            ※ 예약 승인 시 별도의 이메일로 안내드립니다.<br>
            ※ 예약 현황은 시설예약 시스템에서 확인 가능합니다.
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">계룡대학습관</p>
          <p style="margin: 5px 0;">충남 계룡시 신도안3길 72 | TEL: 042-551-1543</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: data.to,
    subject: `[계룡대학습관] 시설 예약 신청 완료 - ${data.facilityName}`,
    html,
  });
}

// 예약 승인 이메일
export async function sendApprovalEmail(data: {
  to: string;
  name: string;
  facilityName: string;
  startAt: string;
  endAt: string;
  qrCode?: string;
}): Promise<boolean> {
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #22c55e; }
        .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .info-label { color: #6b7280; width: 100px; }
        .info-value { color: #111827; font-weight: 500; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .status-approved { background: #dcfce7; color: #166534; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 13px; }
        .qr-box { text-align: center; margin: 20px 0; padding: 20px; background: #f0fdf4; border-radius: 8px; border: 2px solid #22c55e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">✅ 예약이 승인되었습니다!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">계룡대학습관 시설예약 시스템</p>
        </div>
        
        <div class="content">
          <p>안녕하세요, <strong>${data.name}</strong>님!</p>
          <p>신청하신 시설 예약이 <strong style="color: #22c55e;">승인</strong>되었습니다.</p>
          
          <div class="info-box">
            <h3 style="margin: 0 0 15px 0; color: #374151;">📋 예약 정보</h3>
            <div class="info-row">
              <span class="info-label">시설명</span>
              <span class="info-value">${data.facilityName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">시작 시간</span>
              <span class="info-value">${formatDateTime(data.startAt)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">종료 시간</span>
              <span class="info-value">${formatDateTime(data.endAt)}</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="info-label">상태</span>
              <span class="status status-approved">승인됨</span>
            </div>
          </div>

          ${data.qrCode ? `
          <div class="qr-box">
            <p style="margin: 0 0 10px 0; color: #166534; font-size: 14px; font-weight: 600;">📱 체크인 코드</p>
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #22c55e;">${data.qrCode}</div>
            <p style="margin: 15px 0 0 0; color: #166534; font-size: 13px;">
              예약 시간에 맞춰 이 코드로 체크인해 주세요!
            </p>
          </div>
          ` : ''}

          <p style="color: #6b7280; font-size: 14px;">
            ※ 예약 시간 10분 전부터 체크인이 가능합니다.<br>
            ※ 체크인 없이 시작 시간 30분 경과 시 예약이 자동 취소될 수 있습니다.
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">계룡대학습관</p>
          <p style="margin: 5px 0;">충남 계룡시 신도안3길 72 | TEL: 042-551-1543</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: data.to,
    subject: `[계룡대학습관] 시설 예약 승인 완료 - ${data.facilityName}`,
    html,
  });
}

// 예약 거절 이메일
export async function sendRejectionEmail(data: {
  to: string;
  name: string;
  facilityName: string;
  startAt: string;
  endAt: string;
  reason?: string;
}): Promise<boolean> {
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #ef4444; }
        .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .info-label { color: #6b7280; width: 100px; }
        .info-value { color: #111827; font-weight: 500; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .reason-box { background: #fef2f2; border-radius: 8px; padding: 15px; margin: 15px 0; border: 1px solid #fecaca; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">❌ 예약이 거절되었습니다</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">계룡대학습관 시설예약 시스템</p>
        </div>
        
        <div class="content">
          <p>안녕하세요, <strong>${data.name}</strong>님.</p>
          <p>죄송합니다. 신청하신 시설 예약이 거절되었습니다.</p>
          
          <div class="info-box">
            <h3 style="margin: 0 0 15px 0; color: #374151;">📋 예약 정보</h3>
            <div class="info-row">
              <span class="info-label">시설명</span>
              <span class="info-value">${data.facilityName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">시작 시간</span>
              <span class="info-value">${formatDateTime(data.startAt)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">종료 시간</span>
              <span class="info-value">${formatDateTime(data.endAt)}</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="info-label">상태</span>
              <span class="status status-rejected">거절됨</span>
            </div>
          </div>

          ${data.reason ? `
          <div class="reason-box">
            <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 14px;">📝 거절 사유</p>
            <p style="margin: 10px 0 0 0; color: #7f1d1d;">${data.reason}</p>
          </div>
          ` : ''}

          <p style="color: #6b7280; font-size: 14px;">
            ※ 다른 시간대로 다시 예약 신청해 주시기 바랍니다.<br>
            ※ 문의사항은 관리실로 연락 부탁드립니다.
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">계룡대학습관</p>
          <p style="margin: 5px 0;">충남 계룡시 신도안3길 72 | TEL: 042-551-1543</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: data.to,
    subject: `[계룡대학습관] 시설 예약 거절 안내 - ${data.facilityName}`,
    html,
  });
}

// 관리자에게 새 예약 알림
export async function sendNewReservationNotification(data: {
  to: string;
  applicantName: string;
  applicantPhone: string;
  facilityName: string;
  startAt: string;
  endAt: string;
  purpose: string;
}): Promise<boolean> {
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #f59e0b; }
        .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .info-label { color: #6b7280; width: 100px; }
        .info-value { color: #111827; font-weight: 500; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 13px; }
        .action-btn { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">🔔 새로운 예약 신청</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">승인 대기 중인 예약이 있습니다</p>
        </div>
        
        <div class="content">
          <p>새로운 시설 예약 신청이 접수되었습니다.</p>
          
          <div class="info-box">
            <h3 style="margin: 0 0 15px 0; color: #374151;">📋 예약 정보</h3>
            <div class="info-row">
              <span class="info-label">신청자</span>
              <span class="info-value">${data.applicantName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">연락처</span>
              <span class="info-value">${data.applicantPhone}</span>
            </div>
            <div class="info-row">
              <span class="info-label">시설명</span>
              <span class="info-value">${data.facilityName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">시작 시간</span>
              <span class="info-value">${formatDateTime(data.startAt)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">종료 시간</span>
              <span class="info-value">${formatDateTime(data.endAt)}</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="info-label">사용 목적</span>
              <span class="info-value">${data.purpose}</span>
            </div>
          </div>

          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/reservations" class="action-btn">
              예약 관리 바로가기
            </a>
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">계룡대학습관 시설예약 시스템</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: data.to,
    subject: `[관리자 알림] 새 예약 신청 - ${data.facilityName} (${data.applicantName})`,
    html,
  });
}
