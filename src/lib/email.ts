import nodemailer from "nodemailer";

// 이메일 전송 설정 (Gmail 예시)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "", // 앱 비밀번호 사용
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  // 이메일 설정이 없으면 스킵
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Email not configured, skipping:", subject);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"시설물 예약 시스템" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent to:", to);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

// 예약 승인 이메일
export async function sendApprovalEmail(
  to: string,
  data: {
    facilityName: string;
    date: string;
    time: string;
    applicantName: string;
    reservationId: string;
  }
) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #22c55e;">✅ 예약이 승인되었습니다</h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <p><strong>시설:</strong> ${data.facilityName}</p>
        <p><strong>날짜:</strong> ${data.date}</p>
        <p><strong>시간:</strong> ${data.time}</p>
        <p><strong>신청자:</strong> ${data.applicantName}</p>
        <p><strong>예약번호:</strong> ${data.reservationId.slice(0, 8).toUpperCase()}</p>
      </div>
      <p>예약 확인서는 시스템에서 출력하실 수 있습니다.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #888; font-size: 12px;">
        계룡대학습관(계룡) | TEL: 042-551-1543 | E-mail: pik8241@konyang.ac.kr
      </p>
    </div>
  `;

  return sendEmail({ to, subject: `[예약승인] ${data.facilityName} - ${data.date}`, html });
}

// 예약 거절 이메일
export async function sendRejectionEmail(
  to: string,
  data: {
    facilityName: string;
    date: string;
    time: string;
    applicantName: string;
    reason?: string;
  }
) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #ef4444;">❌ 예약이 거절되었습니다</h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <p><strong>시설:</strong> ${data.facilityName}</p>
        <p><strong>날짜:</strong> ${data.date}</p>
        <p><strong>시간:</strong> ${data.time}</p>
        <p><strong>신청자:</strong> ${data.applicantName}</p>
        ${data.reason ? `<p><strong>거절 사유:</strong> ${data.reason}</p>` : ""}
      </div>
      <p>다른 시간대로 다시 예약해 주세요.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #888; font-size: 12px;">
        계룡대학습관(계룡) | TEL: 042-551-1543 | E-mail: pik8241@konyang.ac.kr
      </p>
    </div>
  `;

  return sendEmail({ to, subject: `[예약거절] ${data.facilityName} - ${data.date}`, html });
}

// 새 예약 알림 (관리자용)
export async function sendNewReservationNotification(
  to: string,
  data: {
    facilityName: string;
    date: string;
    time: string;
    applicantName: string;
    applicantPhone: string;
    purpose: string;
  }
) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #3b82f6;">📬 새 예약 신청이 있습니다</h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <p><strong>시설:</strong> ${data.facilityName}</p>
        <p><strong>날짜:</strong> ${data.date}</p>
        <p><strong>시간:</strong> ${data.time}</p>
        <p><strong>신청자:</strong> ${data.applicantName}</p>
        <p><strong>연락처:</strong> ${data.applicantPhone}</p>
        <p><strong>사용목적:</strong> ${data.purpose}</p>
      </div>
      <p>관리자 페이지에서 승인/거절 처리해 주세요.</p>
    </div>
  `;

  return sendEmail({ to, subject: `[새예약] ${data.facilityName} - ${data.applicantName}`, html });
}
