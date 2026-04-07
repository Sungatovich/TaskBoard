import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";
import emailjs from "@emailjs/browser";

/* =========================================================
   API
========================================================= */

/*
  ВАЖНО:
  На сервере должен быть POST http://localhost:5000/send-code
  body: { email, code }
*/


const sendVerificationEmail = async (email, code) => {
  try {
    const result = await emailjs.send(
      "service_diumybs",
      "template_0t8xle8",
      {
        to_email: email,
        code: code,
      },
      "iaK6pMfGWGYSxq5nU"
    );

    console.log("EmailJS success:", result);
    return true;
  } catch (error) {
    console.error("EmailJS error:", error);
    alert("Ошибка EmailJS: " + (error?.text || error?.message || "Unknown error"));
    return false;
  }
};
/* =========================================================
   localStorage helpers
========================================================= */

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* =========================================================
   Utils
========================================================= */

function sortByDateTime(a, b) {
  const A = `${a.date || ""} ${a.time || ""}`;
  const B = `${b.date || ""} ${b.time || ""}`;
  return A.localeCompare(B);
}

function safeTrim(s) {
  return (s ?? "").toString().trim();
}

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function isOverdue(task) {
  if (!task?.date || !task?.time) return false;
  if (task.status === "done" || task.status === "canceled") return false;

  const deadline = new Date(`${task.date}T${task.time}`);
  if (Number.isNaN(deadline.getTime())) return false;

  return deadline.getTime() < Date.now();
}

function generateCode6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatDateHuman(dateStr) {
  if (!dateStr) return "Без даты";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString();
}

async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* =========================================================
   Small reusable UI
========================================================= */

function SectionTitle({ title, subtitle, right }) {
  return (
    <div className="sectionHead">
      <div>
        <div className="sectionTitle">{title}</div>
        {subtitle ? <div className="sectionSubtitle">{subtitle}</div> : null}
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}

function Card({ title, right, children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {(title || right) && (
        <div className="rowBetween">
          <div className="cardTitle">{title}</div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, badge }) {
  return (
    <div className="card statCard">
      <div className="statTop">
        <div className="statLabel">{label}</div>
        {badge ? <div className="badge">{badge}</div> : null}
      </div>
      <div className="statValue">{value}</div>
      {sub ? <div className="statSub">{sub}</div> : null}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="emptyState">
      <div className="emptyIcon">📭</div>
      <div className="emptyTitle">{title}</div>
      <div className="emptyText">{text}</div>
    </div>
  );
}

/* =========================================================
   Layout
========================================================= */

function Sidebar({ active, onNav, isOpen, onClose }) {
  const Item = ({ id, icon, label }) => (
    <button
      className={`navItem ${active === id ? "active" : ""}`}
      onClick={() => {
        onNav(id);
        onClose?.();
      }}
      type="button"
    >
      <span className="navIcon">{icon}</span>
      <span className="navLabel">{label}</span>
    </button>
  );

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="brand">
        <div className="brandDot" />
        <div className="brandText">TaskBoard</div>
      </div>

      <div className="nav">
        <Item id="overview" icon="📊" label="Обзор" />
        <Item id="stats" icon="📈" label="Статистика" />
        <Item id="tasks" icon="✅" label="Задачи" />
        <Item id="calendar" icon="🗓️" label="Календарь" />
        <Item id="users" icon="👥" label="Пользователи" />
        <Item id="settings" icon="⚙️" label="Настройки" />
        <Item id="profile" icon="👤" label="Профиль" />
      </div>

      <div className="sidebarFooter">
        <div className="tipCard">
          <div className="tipTitle">Подсказка</div>
          <div className="tipText">
            Admin видит все задачи и управляет пользователями. User видит
            только свои задачи и может менять их статус.
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({
  title,
  subtitle,
  user,
  onLogout,
  onSearch,
  searchValue,
  darkMode,
  onToggleDark,
  onToggleSidebar,
}) {
  return (
    <div className="topbar">
      <div className="topbarLeft">
        <button
          className="btn ghost mobileMenuBtn"
          type="button"
          onClick={onToggleSidebar}
        >
          ☰
        </button>

        <div>
          <div className="projectTitle">{title}</div>
          <div className="projectSubtitle">{subtitle}</div>
        </div>
      </div>

      <div className="topbarRight">
        <div className="searchBox">
          <span className="icon">🔎</span>
          <input
            className="searchInput"
            placeholder="Поиск задач..."
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <button
          className="btn ghost"
          type="button"
          onClick={onToggleDark}
          title="Сменить тему"
        >
          {darkMode ? "☀" : "🌙"}
        </button>

        <div className="userPill">
          <span className="avatar">
            {(user?.username || "U").slice(0, 1).toUpperCase()}
          </span>
          <span className="muted small">
            {user?.username} • {user?.role}
          </span>
        </div>

        <button className="btn ghost" onClick={onLogout} type="button">
          Выйти
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   Task UI
========================================================= */

function StatusChip({ status, overdue }) {
  const map = {
    todo: { text: "To-do", cls: "chipTodo" },
    inprogress: { text: "В работе", cls: "chipProgress" },
    done: { text: "Done", cls: "chipDone" },
    canceled: { text: "Отменено", cls: "chipCanceled" },
  };

  const info = map[status] || map.todo;
  const cls = `chip ${info.cls} ${overdue ? "chipOverdue" : ""}`;

  return <div className={cls}>{overdue ? "Просрочено" : info.text}</div>;
}

function TaskRow({
  task,
  isAdmin,
  canUserUpdate,
  onSetStatus,
  onEdit,
  onDelete,
}) {
  const overdue = isOverdue(task);

  return (
    <div
      className={`taskRow ${task.status === "done" ? "done" : ""} ${
        overdue ? "overdue" : ""
      }`}
    >
      <div className="taskLeft">
        <div className="taskTitleRow">
          <div className="taskTitle">{task.title}</div>
          <StatusChip status={task.status} overdue={overdue} />
        </div>

        <div className="taskMeta">
          <span>👤 {task.assignedTo}</span>
          <span>📅 {task.date || "—"}</span>
          <span>⏰ {task.time || "—"}</span>
          {task.priority ? <span>⭐ {task.priority}</span> : null}
        </div>

        {task.description ? (
          <div className="taskDesc muted small">{task.description}</div>
        ) : null}
      </div>

      <div className="taskRight">
        {canUserUpdate ? (
          <>
            <button
              className="btn ghost"
              type="button"
              onClick={() => onSetStatus(task.id, "inprogress")}
            >
              ▶ В работе
            </button>

            <button
              className="btn ghost"
              type="button"
              onClick={() => onSetStatus(task.id, "done")}
            >
              ✅ Выполнено
            </button>

            <button
              className="btn danger"
              type="button"
              onClick={() => onSetStatus(task.id, "canceled")}
            >
              ✖ Отменено
            </button>
          </>
        ) : null}

        {isAdmin ? (
          <>
            <button
              className="btn ghost"
              onClick={() => onEdit(task)}
              type="button"
            >
              ✏ Edit
            </button>

            <button
              className="btn danger"
              onClick={() => onDelete(task.id)}
              type="button"
            >
              ✖
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* =========================================================
   Auth screens
========================================================= */

function AuthScreen({
  mode,
  setMode,
  loginOrEmail,
  setLoginOrEmail,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  onLogin,
  onRegister,
  onForgot,
}) {
  const isLogin = mode === "login";

  return (
    <div className="loginWrap">
      <div className="loginCard cardAnim">
        <div className="loginHeader">
          <div className="brandMini">
            <span className="brandDot" />
            <span className="brandText">TaskBoard</span>
          </div>

          <div className="loginTitle">{isLogin ? "Вход" : "Регистрация"}</div>
          <div className="muted small">Админ по умолчанию: admin / admin</div>
        </div>

        <div className="loginForm">
          {isLogin ? (
            <label className="field">
              <span className="fieldLabel">Логин или Email</span>
              <input
                className="input"
                value={loginOrEmail}
                onChange={(e) => setLoginOrEmail(e.target.value)}
                placeholder="например: din или din@mail.com"
                onKeyDown={(e) => e.key === "Enter" && onLogin()}
              />
            </label>
          ) : (
            <>
              <label className="field">
                <span className="fieldLabel">Логин</span>
                <input
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="например: din"
                  onKeyDown={(e) => e.key === "Enter" && onRegister()}
                />
              </label>

              <label className="field">
                <span className="fieldLabel">Email</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  onKeyDown={(e) => e.key === "Enter" && onRegister()}
                />
              </label>
            </>
          )}

          <label className="field">
            <span className="fieldLabel">Пароль</span>
            <div className="passwordField">
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) =>
                  e.key === "Enter" && (isLogin ? onLogin() : onRegister())
                }
              />
              <button
                className="eyeBtn"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                title="Показать/скрыть пароль"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </label>

          {isLogin ? (
            <>
              <button className="btn primary" onClick={onLogin} type="button">
                Войти
              </button>

              <button className="btn ghost" onClick={onForgot} type="button">
                Забыли пароль?
              </button>
            </>
          ) : (
            <button className="btn primary" onClick={onRegister} type="button">
              Создать аккаунт
            </button>
          )}

          <button
            className="btn ghost"
            type="button"
            onClick={() => setMode(isLogin ? "register" : "login")}
          >
            {isLogin ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}

function VerifyScreen({
  pendingEmail,
  pendingUsername,
  codeInput,
  setCodeInput,
  onVerify,
  onResend,
  onCancel,
  secondsLeft,
  blockedSecondsLeft,
  attemptsLeft,
  canResend,
}) {
  return (
    <div className="loginWrap">
      <div className="loginCard cardAnim">
        <div className="loginHeader">
          <div className="brandMini">
            <span className="brandDot" />
            <span className="brandText">TaskBoard</span>
          </div>

          <div className="loginTitle">Подтверждение Email</div>

          <div className="muted small">
            Мы отправили код на: <b>{pendingEmail}</b>
          </div>
          <div className="muted small">Пользователь: {pendingUsername}</div>
          <div className="muted small">
            ⏳ Код истекает через: <b>{secondsLeft}</b> сек
          </div>

          {blockedSecondsLeft > 0 ? (
            <div className="muted small" style={{ color: "#dc2626" }}>
              🚫 Блокировка: подожди <b>{blockedSecondsLeft}</b> сек
            </div>
          ) : (
            <div className="muted small">
              Попыток осталось: <b>{attemptsLeft}</b>
            </div>
          )}
        </div>

        <div className="loginForm">
          <label className="field">
            <span className="fieldLabel">Код (6 цифр)</span>
            <input
              className="input"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="например: 123456"
              onKeyDown={(e) => e.key === "Enter" && onVerify()}
              disabled={blockedSecondsLeft > 0}
            />
          </label>

          <button
            className="btn primary"
            onClick={onVerify}
            type="button"
            disabled={blockedSecondsLeft > 0}
          >
            Подтвердить
          </button>

          <button
            className="btn ghost"
            onClick={onResend}
            type="button"
            disabled={!canResend}
          >
            {canResend ? "Отправить код ещё раз" : "Повтор через 60 сек"}
          </button>

          <button className="btn danger" onClick={onCancel} type="button">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

function ForgotScreen({ email, setEmail, onSend, onBack }) {
  return (
    <div className="loginWrap">
      <div className="loginCard cardAnim">
        <div className="loginHeader">
          <div className="brandMini">
            <span className="brandDot" />
            <span className="brandText">TaskBoard</span>
          </div>

          <div className="loginTitle">Сброс пароля</div>
          <div className="muted small">Введи email — мы отправим код.</div>
        </div>

        <div className="loginForm">
          <label className="field">
            <span className="fieldLabel">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              onKeyDown={(e) => e.key === "Enter" && onSend()}
            />
          </label>

          <button className="btn primary" onClick={onSend} type="button">
            Отправить код
          </button>

          <button className="btn ghost" onClick={onBack} type="button">
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetScreen({
  pendingEmail,
  codeInput,
  setCodeInput,
  newPassword,
  setNewPassword,
  showNewPassword,
  setShowNewPassword,
  onConfirm,
  onResend,
  onCancel,
  timerSec,
}) {
  return (
    <div className="loginWrap">
      <div className="loginCard cardAnim">
        <div className="loginHeader">
          <div className="brandMini">
            <span className="brandDot" />
            <span className="brandText">TaskBoard</span>
          </div>

          <div className="loginTitle">Подтверди сброс</div>
          <div className="muted small">
            Код отправлен на: <b>{pendingEmail}</b>
          </div>
          <div className="muted small">Код действует: {timerSec}s</div>
        </div>

        <div className="loginForm">
          <label className="field">
            <span className="fieldLabel">Код (6 цифр)</span>
            <input
              className="input"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="например: 123456"
              onKeyDown={(e) => e.key === "Enter" && onConfirm()}
            />
          </label>

          <label className="field">
            <span className="fieldLabel">Новый пароль</span>
            <div className="passwordField">
              <input
                className="input"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && onConfirm()}
              />
              <button
                type="button"
                className="eyeBtn"
                onClick={() => setShowNewPassword((v) => !v)}
                title={showNewPassword ? "Скрыть" : "Показать"}
              >
                👁
              </button>
            </div>
          </label>

          <button className="btn primary" onClick={onConfirm} type="button">
            Сменить пароль
          </button>

          <button className="btn ghost" onClick={onResend} type="button">
            Отправить код ещё раз
          </button>

          <button className="btn danger" onClick={onCancel} type="button">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Page blocks
========================================================= */

function OverviewPage({
  isAdmin,
  totalTasks,
  doneTasks,
  todoTasks,
  prog,
  overdueTasks,
  userCount,
  filteredTasks,
  tasks,
  currentUser,
  onSetStatus,
  onEdit,
  onDelete,
}) {
  const recentTasks = filteredTasks.slice(0, 6);

  return (
    <div className="pageWrap">
      <SectionTitle
        title="Обзор"
        subtitle={
          isAdmin
            ? "Краткая сводка по задачам и пользователям"
            : `Твои задачи, ${currentUser?.username}`
        }
      />

      <div className="statsGrid">
        <StatCard
          label="Всего задач"
          value={totalTasks}
          sub="Общее количество"
        />
        <StatCard
          label="Выполнено"
          value={doneTasks}
          sub={`${prog}% завершено`}
          badge="Progress"
        />
        <StatCard
          label="Активные"
          value={todoTasks}
          sub="To-do + In progress"
        />
        <StatCard
          label="Просроченные"
          value={overdueTasks}
          sub="Нужно проверить сроки"
          badge={overdueTasks > 0 ? "Attention" : "OK"}
        />
        {isAdmin ? (
          <StatCard
            label="Пользователи"
            value={userCount}
            sub="Только role=user"
          />
        ) : null}
      </div>

      <div className="twoCols">
        <Card
          title="Быстрый статус"
          right={<div className="badge">{prog}%</div>}
        >
          <div className="progressBar">
            <div
              className="progressBarFill"
              style={{ width: `${prog}%` }}
            />
          </div>

          <div className="miniInfoGrid">
            <div className="miniInfoItem">
              <div className="miniInfoLabel">Всего</div>
              <div className="miniInfoValue">{totalTasks}</div>
            </div>

            <div className="miniInfoItem">
              <div className="miniInfoLabel">Сделано</div>
              <div className="miniInfoValue">{doneTasks}</div>
            </div>

            <div className="miniInfoItem">
              <div className="miniInfoLabel">Активные</div>
              <div className="miniInfoValue">{todoTasks}</div>
            </div>

            <div className="miniInfoItem">
              <div className="miniInfoLabel">Просрочено</div>
              <div className="miniInfoValue">{overdueTasks}</div>
            </div>
          </div>
        </Card>

        <Card title="Последние задачи">
          {recentTasks.length === 0 ? (
            <EmptyState
              title="Пока пусто"
              text="Добавь задачи, и они появятся здесь."
            />
          ) : (
            <div className="taskList">
              {recentTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isAdmin={isAdmin}
                  canUserUpdate={
                    !isAdmin && task.assignedTo === currentUser?.username
                  }
                  onSetStatus={onSetStatus}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Сводка по всему списку">
        {tasks.length === 0 ? (
          <EmptyState
            title="Нет задач"
            text="Создай первую задачу, чтобы увидеть аналитику."
          />
        ) : (
          <div className="summaryChips">
            <div className="summaryChip">✅ Done: {doneTasks}</div>
            <div className="summaryChip">🟡 Todo/In progress: {todoTasks}</div>
            <div className="summaryChip">⏰ Overdue: {overdueTasks}</div>
            {isAdmin ? (
              <div className="summaryChip">👥 Users: {userCount}</div>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatsPage({
  isAdmin,
  s_total,
  s_done,
  s_todo,
  s_inprogress,
  s_canceled,
  s_overdue,
  s_progress,
  perUser,
}) {
  return (
    <div className="pageWrap">
      <SectionTitle
        title="Статистика"
        subtitle={
          isAdmin
            ? "Статистика всей системы"
            : "Статистика по твоим задачам"
        }
      />

      <div className="statsGrid">
        <StatCard label="Всего" value={s_total} />
        <StatCard label="Done" value={s_done} sub={`${s_progress}%`} />
        <StatCard label="To-do" value={s_todo} />
        <StatCard label="In progress" value={s_inprogress} />
        <StatCard label="Canceled" value={s_canceled} />
        <StatCard label="Overdue" value={s_overdue} />
      </div>

      <Card title="Прогресс выполнения">
        <div className="progressBar large">
          <div
            className="progressBarFill"
            style={{ width: `${s_progress}%` }}
          />
        </div>
        <div className="muted small">Выполнено: {s_progress}%</div>
      </Card>

      {isAdmin ? (
        <Card title="По пользователям">
          {perUser.length === 0 ? (
            <EmptyState
              title="Нет данных"
              text="Когда появятся пользователи и задачи, здесь будет статистика."
            />
          ) : (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Всего</th>
                    <th>Done</th>
                    <th>Просрочено</th>
                    <th>Прогресс</th>
                  </tr>
                </thead>
                <tbody>
                  {perUser.map((row) => (
                    <tr key={row.user}>
                      <td>{row.user}</td>
                      <td>{row.total}</td>
                      <td>{row.done}</td>
                      <td>{row.overdue}</td>
                      <td>{percent(row.done, row.total)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}

function TasksPage({
  isAdmin,
  users,
  currentUser,
  filteredTasks,
  taskFilter,
  setTaskFilter,
  userFilter,
  setUserFilter,
  title,
  setTitle,
  date,
  setDate,
  time,
  setTime,
  assignedTo,
  setAssignedTo,
  priority,
  setPriority,
  description,
  setDescription,
  addTask,
  onSetStatus,
  onEdit,
  onDelete,
}) {
  const onlyUsers = users.filter((u) => u.role === "user");

  return (
    <div className="pageWrap">
      <SectionTitle
        title="Задачи"
        subtitle={
          isAdmin
            ? "Управление задачами и фильтрами"
            : "Твои задачи и изменение статуса"
        }
      />

      <Card title="Фильтры">
        <div className="filtersRow">
          <select
            className="select"
            value={taskFilter}
            onChange={(e) => setTaskFilter(e.target.value)}
          >
            <option value="all">Все</option>
            <option value="mine">Мои</option>
            <option value="todo">To-do</option>
            <option value="inprogress">In progress</option>
            <option value="done">Done</option>
            <option value="canceled">Canceled</option>
          </select>

          {isAdmin ? (
            <select
              className="select"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="all">Все пользователи</option>
              {onlyUsers.map((u) => (
                <option key={u.username} value={u.username}>
                  {u.username}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </Card>

      {isAdmin ? (
        <Card title="Добавить задачу">
          <div className="formGrid">
            <label className="field">
              <span className="fieldLabel">Название</span>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Сделать отчёт"
              />
            </label>

            <label className="field">
              <span className="fieldLabel">Дата</span>
              <input
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="fieldLabel">Время</span>
              <input
                className="input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="fieldLabel">Пользователь</span>
              <select
                className="select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Выбери пользователя</option>
                {onlyUsers.map((u) => (
                  <option key={u.username} value={u.username}>
                    {u.username}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="fieldLabel">Приоритет</span>
              <select
                className="select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>

            <label className="field full">
              <span className="fieldLabel">Описание</span>
              <textarea
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание задачи"
              />
            </label>
          </div>

          <div className="rowEnd">
            <button className="btn primary" type="button" onClick={addTask}>
              Добавить задачу
            </button>
          </div>
        </Card>
      ) : null}

      <Card
        title={
          isAdmin ? "Список задач" : `Мои задачи (${currentUser?.username})`
        }
      >
        {filteredTasks.length === 0 ? (
          <EmptyState
            title="Список пуст"
            text="По текущим фильтрам ничего не найдено."
          />
        ) : (
          <div className="taskList">
            {filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isAdmin={isAdmin}
                canUserUpdate={!isAdmin && task.assignedTo === currentUser?.username}
                onSetStatus={onSetStatus}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function CalendarPage({
  calendarGroups,
  currentUser,
  isAdmin,
  onSetStatus,
  onEdit,
  onDelete,
}) {
  return (
    <div className="pageWrap">
      <SectionTitle
        title="Календарь"
        subtitle="Группировка задач по датам"
      />

      {calendarGroups.length === 0 ? (
        <Card>
          <EmptyState
            title="Нет событий"
            text="Когда задачи получат дату, они появятся здесь."
          />
        </Card>
      ) : (
        <div className="calendarList">
          {calendarGroups.map((group) => (
            <Card
              key={group.date}
              title={formatDateHuman(group.date)}
              right={<div className="badge">{group.tasks.length}</div>}
            >
              <div className="taskList">
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isAdmin={isAdmin}
                    canUserUpdate={
                      !isAdmin && task.assignedTo === currentUser?.username
                    }
                    onSetStatus={onSetStatus}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersPage({
  isAdmin,
  users,
  newUser,
  setNewUser,
  newPass,
  setNewPass,
  newRole,
  setNewRole,
  addUser,
  changeRole,
  deleteUser,
}) {
  if (!isAdmin) {
    return (
      <div className="pageWrap">
        <Card>
          <EmptyState
            title="Нет доступа"
            text="Раздел пользователей доступен только для admin."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="pageWrap">
      <SectionTitle
        title="Пользователи"
        subtitle="Создание, изменение ролей и удаление"
      />

      <Card title="Добавить пользователя">
        <div className="formGrid">
          <label className="field">
            <span className="fieldLabel">Логин</span>
            <input
              className="input"
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              placeholder="Новый логин"
            />
          </label>

          <label className="field">
            <span className="fieldLabel">Пароль</span>
            <input
              className="input"
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Пароль"
            />
          </label>

          <label className="field">
            <span className="fieldLabel">Роль</span>
            <select
              className="select"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>
        </div>

        <div className="rowEnd">
          <button className="btn primary" type="button" onClick={addUser}>
            Добавить
          </button>
        </div>
      </Card>

      <Card title="Список пользователей">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.username}>
                  <td>{u.username}</td>
                  <td>{u.email || "—"}</td>
                  <td>
                    <select
                      className="select compact"
                      value={u.role}
                      onChange={(e) => changeRole(u.username, e.target.value)}
                      disabled={u.username === "admin"}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{u.verified ? "Yes" : "No"}</td>
                  <td>
                    <button
                      className="btn danger"
                      type="button"
                      onClick={() => deleteUser(u.username)}
                      disabled={u.username === "admin"}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SettingsPage({
  darkMode,
  setDarkMode,
  exportJSON,
  importJSON,
  resetDemo,
}) {
  return (
    <div className="pageWrap">
      <SectionTitle
        title="Настройки"
        subtitle="Тема, резервная копия и импорт данных"
      />

      <Card title="Тема">
        <div className="rowBetween">
          <div>
            <div className="cardTitle">Режим интерфейса</div>
            <div className="muted small">
              Переключай между светлой и тёмной темой
            </div>
          </div>

          <button
            className="btn primary"
            type="button"
            onClick={() => setDarkMode((v) => !v)}
          >
            {darkMode ? "Светлая тема" : "Тёмная тема"}
          </button>
        </div>
      </Card>

      <Card title="Резервная копия">
        <div className="settingsButtons">
          <button className="btn primary" type="button" onClick={exportJSON}>
            Экспорт JSON
          </button>

          <label className="btn ghost fileBtn">
            Импорт JSON
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importJSON(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </Card>

      <Card title="Сброс демо-данных">
        <div className="muted small" style={{ marginBottom: 12 }}>
          Полностью очистит пользователей, задачи и текущую сессию, затем вернёт
          admin/admin.
        </div>
        <button className="btn danger" type="button" onClick={resetDemo}>
          Сбросить всё
        </button>
      </Card>
    </div>
  );
}

/* =========================================================
   Main App
========================================================= */

export default function App() {
  /* ---------- theme + mobile sidebar ---------- */
  const [darkMode, setDarkMode] = useState(() => readLS("darkMode", false));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", !!darkMode);
    writeLS("darkMode", !!darkMode);
  }, [darkMode]);

  /* ---------- data ---------- */
  const [users, setUsers] = useState(() =>
    readLS("users", [
      {
        username: "admin",
        password: "admin",
        role: "admin",
        verified: true,
        email: "",
      },
    ])
  );

  const [currentUser, setCurrentUser] = useState(() =>
    readLS("currentUser", null)
  );

  const [tasks, setTasks] = useState(() => readLS("tasks", []));

  /* ---------- auth form ---------- */
  
  const [authMode, setAuthMode] = useState("login");
  const [loginOrEmail, setLoginOrEmail] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* ---------- verify flow ---------- */
  const [verifyStage, setVerifyStage] = useState(() =>
    readLS("verifyStage", null)
  );
  // { username, email, passwordHash, code, expires, blockedUntil, attempts, resendAfter }
  const [codeInput, setCodeInput] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [blockedSecondsLeft, setBlockedSecondsLeft] = useState(0);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profilePassword2, setProfilePassword2] = useState("");

  /* ---------- reset flow ---------- */
  const [resetStage, setResetStage] = useState(() =>
    readLS("resetStage", null)
  );
  // { email, code, expires }
  const [resetCodeInput, setResetCodeInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetTimerSec, setResetTimerSec] = useState(0);

  /* ---------- ui ---------- */
  const [page, setPage] = useState("overview");
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  /* ---------- admin forms ---------- */
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState("user");

  /* ---------- task form ---------- */
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");

  /* ---------- persist ---------- */
  useEffect(() => writeLS("users", users), [users]);
  useEffect(() => writeLS("tasks", tasks), [tasks]);
  useEffect(() => writeLS("currentUser", currentUser), [currentUser]);
  useEffect(() => writeLS("verifyStage", verifyStage), [verifyStage]);
  useEffect(() => writeLS("resetStage", resetStage), [resetStage]);

  const isAdmin = currentUser?.role === "admin";

  /* =========================================================
     VERIFY timers
  ========================================================= */

  useEffect(() => {
    if (!verifyStage) return;

    const i = setInterval(() => {
      const now = Date.now();

      const left = Math.max(
        0,
        Math.ceil((verifyStage.expires - now) / 1000)
      );
      setSecondsLeft(left);

      const bLeft = verifyStage.blockedUntil
        ? Math.max(0, Math.ceil((verifyStage.blockedUntil - now) / 1000))
        : 0;
      setBlockedSecondsLeft(bLeft);

      const rLeft = verifyStage.resendAfter
        ? Math.max(0, Math.ceil((verifyStage.resendAfter - now) / 1000))
        : 0;
      setResendSecondsLeft(rLeft);
    }, 500);
    return () => clearInterval(i);
  }, [verifyStage]);

  /* =========================================================
     RESET timer
  ========================================================= */

  useEffect(() => {
    if (!resetStage?.expires) return;

    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((resetStage.expires - Date.now()) / 1000)
      );
      setResetTimerSec(left);

      if (left === 0) {
        setResetStage(null);
        setResetCodeInput("");
        setNewPassword("");
        alert("Код сброса истёк. Запроси новый код.");
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resetStage]);




  useEffect(() => {
    if (currentUser) {
      setProfileUsername(currentUser.username || "");
      setProfileEmail(currentUser.email || "");
      setProfilePassword("");
      setProfilePassword2("");
    }
  }, [currentUser]);

  /* =========================================================
     AUTH
  ========================================================= */


  const saveProfile = async () => {
    if (!currentUser) return;
  
    const newUsername = safeTrim(profileUsername);
    const newEmail = safeTrim(profileEmail).toLowerCase();
  
    if (!newUsername) {
      alert("Введите имя пользователя");
      return;
    }
  
    if (newEmail && !isValidEmail(newEmail)) {
      alert("Неверный email");
      return;
    }
  
    const usernameTaken = users.some(
      (u) =>
        u.username.toLowerCase() === newUsername.toLowerCase() &&
        u.username !== currentUser.username
    );
  
    if (usernameTaken) {
      alert("Такой логин уже занят");
      return;
    }
  
    const emailTaken = users.some(
      (u) =>
        (u.email || "").toLowerCase() === newEmail &&
        u.username !== currentUser.username
    );
  
    if (newEmail && emailTaken) {
      alert("Такой email уже используется");
      return;
    }
  
    if (profilePassword && profilePassword.length < 4) {
      alert("Пароль должен быть минимум 4 символа");
      return;
    }
  
    if (profilePassword !== profilePassword2) {
      alert("Пароли не совпадают");
      return;
    }
  
    let updatedPassword = currentUser.password;
  
    if (profilePassword) {
      updatedPassword = await hashPassword(profilePassword);
    }
  
    const oldUsername = currentUser.username;
  
    const updatedUser = {
      ...currentUser,
      username: newUsername,
      email: newEmail,
      password: updatedPassword,
    };
  
    setUsers((prev) =>
      prev.map((u) =>
        u.username === oldUsername
          ? {
              ...u,
              username: newUsername,
              email: newEmail,
              password: updatedPassword,
            }
          : u
      )
    );
  
    setTasks((prev) =>
      prev.map((t) =>
        t.assignedTo === oldUsername
          ? { ...t, assignedTo: newUsername }
          : t
      )
    );
  
    setCurrentUser(updatedUser);
    setProfilePassword("");
    setProfilePassword2("");
  
    alert("Профиль успешно обновлён");
  };


  const login = async () => {
    const ident = safeTrim(loginOrEmail).toLowerCase();
    const p = safeTrim(password);

    if (!ident || !p) {
      alert("Введи логин/email и пароль");
      return;
    }

    const hashed = await hashPassword(p);

    // пользователь с хэш-паролем
    const user = users.find((x) => {
      const un = (x.username ?? "").toLowerCase();
      const em = (x.email ?? "").toLowerCase();
      return (un === ident || em === ident) && x.password === hashed;
    });

    // совместимость: admin может быть plain "admin" или уже hash
    const adminUser = users.find(
      (x) =>
        x.username === "admin" &&
        (x.password === "admin" || x.password === hashed)
    );

    const found = user || adminUser;
    if (!found) {
      alert("Неверный логин/email или пароль");
      return;
    }

    if (found.role !== "admin" && found.verified !== true) {
      alert("Email не подтвержден. Заверши подтверждение при регистрации.");
      return;
    }

    // апгрейд админа на hash, если был plain
    if (found.username === "admin" && found.password === "admin") {
      setUsers((prev) =>
        prev.map((u) =>
          u.username === "admin" ? { ...u, password: hashed } : u
        )
      );
    }

    setCurrentUser({
      ...found,
      password: found.username === "admin" ? hashed : found.password,
    });
    setLoginOrEmail("");
    setPassword("");
    setShowPassword(false);
    setAuthMode("login");
    setPage("overview");
  };

  const register = async () => {
    const u = safeTrim(username);
    const p = safeTrim(password);
    const e = safeTrim(email).toLowerCase();

    if (!u || !p || !e) {
      alert("Заполни все поля");
      return;
    }

    if (!isValidEmail(e)) {
      alert("Неверный Email");
      return;
    }

    if (
      users.some((x) => (x.username ?? "").toLowerCase() === u.toLowerCase())
    ) {
      alert("Пользователь уже существует");
      return;
    }

    if (users.some((x) => (x.email ?? "").toLowerCase() === e)) {
      alert("Email уже используется");
      return;
    }

    const passwordHash = await hashPassword(p);
    const code = generateCode6();

    const ok = await sendVerificationEmail(e, code);
    if (!ok) {
      alert("Не удалось отправить код. Проверь сервер.");
      return;
    }

    setVerifyStage({
      username: u,
      email: e,
      passwordHash,
      code,
      expires: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      blockedUntil: null,
      resendAfter: Date.now() + 60 * 1000,
    });

    alert("Код отправлен на почту. Введи код подтверждения.");
  };

  const verifyCode = () => {
    if (!verifyStage) return;

    const now = Date.now();

    if (verifyStage.expires && now > verifyStage.expires) {
      alert("Код истёк. Нажми “Отправить код ещё раз”.");
      return;
    }

    if (verifyStage.blockedUntil && now < verifyStage.blockedUntil) {
      const sec = Math.ceil((verifyStage.blockedUntil - now) / 1000);
      alert(`Слишком много попыток. Подожди ${sec} сек`);
      return;
    }

    const input = safeTrim(codeInput);

    if (input !== verifyStage.code) {
      const attempts = (verifyStage.attempts ?? 0) + 1;

      if (attempts >= 5) {
        setVerifyStage((prev) => ({
          ...prev,
          attempts: 0,
          blockedUntil: Date.now() + 2 * 60 * 1000,
        }));
        alert("Слишком много попыток. Блокировка на 2 минуты.");
        return;
      }

      setVerifyStage((prev) => ({
        ...prev,
        attempts,
      }));
      alert("Неверный код");
      return;
    }

    const created = {
      username: verifyStage.username,
      password: verifyStage.passwordHash,
      email: verifyStage.email,
      role: "user",
      verified: true,
    };

    setUsers((prev) => [...prev, created]);

    alert("Email подтвержден! Аккаунт создан.");

    setVerifyStage(null);
    setCodeInput("");
    setAuthMode("login");
    setUsername("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  const resendCode = async () => {
    if (!verifyStage) return;

    const now = Date.now();

    if (verifyStage.resendAfter && now < verifyStage.resendAfter) {
      const sec = Math.ceil((verifyStage.resendAfter - now) / 1000);
      alert(`Можно отправить повторно через ${sec} сек`);
      return;
    }

    const newCode = generateCode6();
    const ok = await sendVerificationEmail(verifyStage.email, newCode);

    if (!ok) {
      alert("Не удалось отправить код ещё раз");
      return;
    }

    setVerifyStage((prev) => ({
      ...prev,
      code: newCode,
      expires: Date.now() + 5 * 60 * 1000,
      resendAfter: Date.now() + 60 * 1000,
      attempts: 0,
      blockedUntil: null,
    }));

    alert("Код отправлен ещё раз.");
  };

  const cancelVerify = () => {
    setVerifyStage(null);
    setCodeInput("");
    alert("Регистрация отменена.");
  };

  /* =========================================================
     RESET PASSWORD
  ========================================================= */

  function ProfilePage({
    currentUser,
    profileUsername,
    setProfileUsername,
    profileEmail,
    setProfileEmail,
    profilePassword,
    setProfilePassword,
    profilePassword2,
    setProfilePassword2,
    saveProfile,
  }) {
    return (
      <div className="pageWrap">
        <SectionTitle
          title="Профиль"
          subtitle="Редактирование личных данных"
        />
  
        <Card title="Мой профиль">
          <div className="profileHeader">
            <div className="profileAvatarBig">
              {(profileUsername || currentUser?.username || "U")
                .slice(0, 1)
                .toUpperCase()}
            </div>
  
            <div>
              <div className="profileName">
                {currentUser?.username}
              </div>
              <div className="muted small">
                Роль: {currentUser?.role}
              </div>
            </div>
          </div>
  
          <div className="formGrid">
            <label className="field">
              <span className="fieldLabel">Имя пользователя</span>
              <input
                className="input"
                value={profileUsername}
                onChange={(e) => setProfileUsername(e.target.value)}
                placeholder="Введите логин"
              />
            </label>
  
            <label className="field">
              <span className="fieldLabel">Email</span>
              <input
                className="input"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="Введите email"
              />
            </label>
  
            <label className="field">
              <span className="fieldLabel">Новый пароль</span>
              <input
                className="input"
                type="password"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                placeholder="Оставь пустым, если не меняешь"
              />
            </label>
  
            <label className="field">
              <span className="fieldLabel">Повтори пароль</span>
              <input
                className="input"
                type="password"
                value={profilePassword2}
                onChange={(e) => setProfilePassword2(e.target.value)}
                placeholder="Повтори новый пароль"
              />
            </label>
          </div>
  
          <div className="rowEnd">
            <button className="btn primary" type="button" onClick={saveProfile}>
              Сохранить изменения
            </button>
          </div>
        </Card>
      </div>
    );
  }

    /* =========================================================
     RESET PASSWORD
  ========================================================= */

  const goForgot = () => {
    setAuthMode("forgot");
    setPassword("");
    setShowPassword(false);
  };

  const requestReset = async () => {
    const e = safeTrim(email).toLowerCase();

    if (!e) {
      alert("Введи Email");
      return;
    }

    if (!isValidEmail(e)) {
      alert("Неверный Email");
      return;
    }

    const user = users.find((u) => (u.email ?? "").toLowerCase() === e);
    if (!user) {
      alert("Аккаунт с таким email не найден");
      return;
    }

    const code = generateCode6();
    const expires = Date.now() + 5 * 60 * 1000;

    const ok = await sendVerificationEmail(e, code);
    if (!ok) {
      alert("Не удалось отправить код сброса");
      return;
    }

    setResetStage({ email: e, code, expires });
    setResetCodeInput("");
    setNewPassword("");
    setShowNewPassword(false);

    alert("Код для сброса отправлен на почту.");
  };

  const resendResetCode = async () => {
    if (!resetStage) return;

    const code = generateCode6();
    const expires = Date.now() + 5 * 60 * 1000;

    const ok = await sendVerificationEmail(resetStage.email, code);
    if (!ok) {
      alert("Не удалось отправить код ещё раз");
      return;
    }

    setResetStage({
      email: resetStage.email,
      code,
      expires,
    });

    setResetCodeInput("");
    alert("Код отправлен ещё раз.");
  };

  const confirmReset = async () => {
    if (!resetStage) return;

    if (Date.now() > resetStage.expires) {
      setResetStage(null);
      alert("Код истёк. Запроси новый.");
      return;
    }

    const input = safeTrim(resetCodeInput);
    if (input !== resetStage.code) {
      alert("Неверный код");
      return;
    }

    const np = safeTrim(newPassword);
    if (np.length < 4) {
      alert("Пароль слишком короткий (минимум 4 символа)");
      return;
    }

    const hashed = await hashPassword(np);

    setUsers((prev) =>
      prev.map((u) =>
        (u.email ?? "").toLowerCase() === resetStage.email
          ? { ...u, password: hashed }
          : u
      )
    );

    alert("Пароль успешно изменён! Теперь войди.");

    setResetStage(null);
    setResetCodeInput("");
    setNewPassword("");
    setAuthMode("login");
  };

  const cancelReset = () => {
    setResetStage(null);
    setResetCodeInput("");
    setNewPassword("");
    setAuthMode("login");
  };

  /* =========================================================
     Logout
  ========================================================= */

  const logout = () => {
    setCurrentUser(null);
    setPage("overview");
    setSearch("");
    setTaskFilter("all");
    setUserFilter("all");
  };

  /* =========================================================
     USERS (admin)
  ========================================================= */

  const addUser = async () => {
    if (!isAdmin) return;

    const u = safeTrim(newUser);
    const p = safeTrim(newPass);

    if (!u || !p) {
      alert("Заполни логин и пароль");
      return;
    }

    if (
      users.some((x) => (x.username ?? "").toLowerCase() === u.toLowerCase())
    ) {
      alert("Пользователь уже существует");
      return;
    }

    const hashed = await hashPassword(p);

    setUsers((prev) => [
      ...prev,
      {
        username: u,
        password: hashed,
        role: newRole,
        verified: true,
        email: "",
      },
    ]);

    setNewUser("");
    setNewPass("");
    setNewRole("user");
  };

  const changeRole = (uname, role) => {
    if (!isAdmin) return;
    if (uname === "admin") {
      alert("Нельзя менять роль admin");
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.username === uname ? { ...u, role } : u))
    );
  };

  const deleteUser = (uname) => {
    if (!isAdmin) return;
    if (uname === "admin") {
      alert("Нельзя удалить admin");
      return;
    }

    const ok = window.confirm(`Удалить пользователя "${uname}"?`);
    if (!ok) return;

    setUsers((prev) => prev.filter((u) => u.username !== uname));
    setTasks((prev) => prev.filter((t) => t.assignedTo !== uname));

    if (currentUser?.username === uname) {
      setCurrentUser(null);
    }
  };

  /* =========================================================
     TASKS
  ========================================================= */

  const addTask = () => {
    if (!isAdmin) return;

    const t = safeTrim(title);
    if (!t || !date || !time || !assignedTo) {
      alert("Заполни: задача / дата / время / пользователь");
      return;
    }

    const task = {
      id: Date.now(),
      title: t,
      date,
      time,
      assignedTo,
      status: "todo",
      priority,
      description: safeTrim(description),
    };

    setTasks((prev) => [...prev, task]);

    setTitle("");
    setDate("");
    setTime("");
    setAssignedTo("");
    setPriority("Medium");
    setDescription("");
  };

  const setTaskStatus = (id, status) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  const deleteTask = (id) => {
    if (!isAdmin) return;

    const ok = window.confirm("Удалить задачу?");
    if (!ok) return;

    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const editTask = (task) => {
    if (!isAdmin) return;

    const newTitle = window.prompt("Название:", task.title);
    if (!newTitle || !safeTrim(newTitle)) return;

    const newDesc =
      window.prompt("Описание (можно пусто):", task.description ?? "") ?? "";

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              title: safeTrim(newTitle),
              description: safeTrim(newDesc),
            }
          : t
      )
    );
  };

  /* =========================================================
     EXPORT / IMPORT
  ========================================================= */

  const exportJSON = () => {
    const payload = { users, tasks };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "taskboard_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = async (file) => {
    try {
      const text = await file.text();
      const obj = JSON.parse(text);

      if (!obj || !Array.isArray(obj.users) || !Array.isArray(obj.tasks)) {
        alert("Неверный файл");
        return;
      }

      const hasAdmin = obj.users.some(
        (u) => u.username === "admin" && u.role === "admin"
      );

      const mergedUsers = hasAdmin
        ? obj.users
        : [
            {
              username: "admin",
              password: "admin",
              role: "admin",
              verified: true,
              email: "",
            },
            ...obj.users,
          ];

      const normalizedUsers = mergedUsers.map((u) => ({
        ...u,
        verified: u.role === "admin" ? true : u.verified === true,
      }));

      const normalizedTasks = obj.tasks.map((t) => ({
        ...t,
        status: t.status || (t.done ? "done" : "todo"),
      }));

      setUsers(normalizedUsers);
      setTasks(normalizedTasks);

      alert("Импорт успешен!");
    } catch (e) {
      console.error(e);
      alert("Ошибка импорта файла");
    }
  };

  const resetDemo = () => {
    const ok = window.confirm(
      "Удалить все данные и вернуть только admin/admin?"
    );
    if (!ok) return;

    const defaultUsers = [
      {
        username: "admin",
        password: "admin",
        role: "admin",
        verified: true,
        email: "",
      },
    ];

    setUsers(defaultUsers);
    setTasks([]);
    setCurrentUser(null);
    setVerifyStage(null);
    setResetStage(null);
    setAuthMode("login");
    setLoginOrEmail("");
    setUsername("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setCodeInput("");
    setResetCodeInput("");
    setNewPassword("");
    setPage("overview");
    setSearch("");
    setTaskFilter("all");
    setUserFilter("all");

    localStorage.removeItem("users");
    localStorage.removeItem("tasks");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("verifyStage");
    localStorage.removeItem("resetStage");

    alert("Система сброшена.");
  };

  /* =========================================================
     Derived data
  ========================================================= */

  const filteredTasks = useMemo(() => {
    if (!currentUser) return [];

    let base = tasks;

    if (!isAdmin) {
      base = base.filter((t) => t.assignedTo === currentUser.username);
    }

    if (isAdmin && userFilter !== "all") {
      base = base.filter((t) => t.assignedTo === userFilter);
    }

    if (taskFilter === "mine") {
      base = base.filter((t) => t.assignedTo === currentUser.username);
    } else if (taskFilter === "done") {
      base = base.filter((t) => t.status === "done");
    } else if (taskFilter === "todo") {
      base = base.filter((t) => t.status === "todo");
    } else if (taskFilter === "inprogress") {
      base = base.filter((t) => t.status === "inprogress");
    } else if (taskFilter === "canceled") {
      base = base.filter((t) => t.status === "canceled");
    }

    const q = safeTrim(search).toLowerCase();
    if (q) {
      base = base.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q) ||
          t.assignedTo.toLowerCase().includes(q)
      );
    }

    return base.slice().sort(sortByDateTime);
  }, [tasks, currentUser, isAdmin, taskFilter, userFilter, search]);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const todoTasks = tasks.filter(
    (t) => t.status === "todo" || t.status === "inprogress"
  ).length;
  const prog = percent(doneTasks, totalTasks);
  const overdueTasks = tasks.filter((t) => isOverdue(t)).length;
  const userCount = users.filter((u) => u.role === "user").length;

  const calendarGroups = useMemo(() => {
    const map = new Map();

    for (const t of filteredTasks) {
      const key = t.date || "Без даты";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }

    const keys = Array.from(map.keys()).sort();
    return keys.map((k) => ({
      date: k,
      tasks: map.get(k).slice().sort(sortByDateTime),
    }));
  }, [filteredTasks]);

  /* =========================================================
     Statistics derived
  ========================================================= */

  const countByStatus = (arr, status) =>
    arr.filter((t) => t.status === status).length;

  const statsBase = useMemo(() => {
    if (!currentUser) return [];
    return isAdmin
      ? tasks
      : tasks.filter((t) => t.assignedTo === currentUser.username);
  }, [tasks, isAdmin, currentUser]);

  const s_total = statsBase.length;
  const s_done = countByStatus(statsBase, "done");
  const s_todo = countByStatus(statsBase, "todo");
  const s_inprogress = countByStatus(statsBase, "inprogress");
  const s_canceled = countByStatus(statsBase, "canceled");
  const s_overdue = statsBase.filter(isOverdue).length;
  const s_progress = percent(s_done, s_total);

  const perUser = useMemo(() => {
    if (!isAdmin) return [];

    const map = new Map();

    for (const u of users) {
      if (u.role !== "user") continue;
      map.set(u.username, {
        user: u.username,
        total: 0,
        done: 0,
        overdue: 0,
      });
    }

    for (const t of tasks) {
      if (!map.has(t.assignedTo)) continue;
      const row = map.get(t.assignedTo);
      row.total += 1;
      if (t.status === "done") row.done += 1;
      if (isOverdue(t)) row.overdue += 1;
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [isAdmin, users, tasks]);

  /* =========================================================
     Render gates
  ========================================================= */

  if (verifyStage) {
    const attemptsLeft = 5 - (verifyStage.attempts ?? 0);
    const canResend = resendSecondsLeft <= 0;

    return (
      <VerifyScreen
        pendingEmail={verifyStage.email}
        pendingUsername={verifyStage.username}
        codeInput={codeInput}
        setCodeInput={setCodeInput}
        onVerify={verifyCode}
        onResend={resendCode}
        onCancel={cancelVerify}
        secondsLeft={secondsLeft}
        blockedSecondsLeft={blockedSecondsLeft}
        attemptsLeft={attemptsLeft}
        canResend={canResend}
      />
    );
  }

  if (resetStage) {
    return (
      <ResetScreen
        pendingEmail={resetStage.email}
        codeInput={resetCodeInput}
        setCodeInput={setResetCodeInput}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        showNewPassword={showNewPassword}
        setShowNewPassword={setShowNewPassword}
        onConfirm={confirmReset}
        onResend={resendResetCode}
        onCancel={cancelReset}
        timerSec={resetTimerSec}
      />
    );
  }

  if (!currentUser) {
    if (authMode === "forgot") {
      return (
        <ForgotScreen
          email={email}
          setEmail={setEmail}
          onSend={requestReset}
          onBack={() => setAuthMode("login")}
        />
      );
    }

    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        loginOrEmail={loginOrEmail}
        setLoginOrEmail={setLoginOrEmail}
        username={username}
        setUsername={setUsername}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        onLogin={login}
        onRegister={register}
        onForgot={goForgot}
      />
    );
  }

/* =========================================================
   Main layout render
========================================================= */

return (
  <div className="appLayout">
    <Sidebar
      active={page}
      onNav={setPage}
      isOpen={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
    />

    <div className="appMain">
      <Topbar
        title="TaskBoard"
        subtitle={
          isAdmin
            ? "Панель администратора задач"
            : "Панель пользователя задач"
        }
        user={currentUser}
        onLogout={logout}
        onSearch={setSearch}
        searchValue={search}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((v) => !v)}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <div className="content">
        {page === "overview" && (
          <OverviewPage
            isAdmin={isAdmin}
            totalTasks={totalTasks}
            doneTasks={doneTasks}
            todoTasks={todoTasks}
            prog={prog}
            overdueTasks={overdueTasks}
            userCount={userCount}
            filteredTasks={filteredTasks}
            tasks={tasks}
            currentUser={currentUser}
            onSetStatus={setTaskStatus}
            onEdit={editTask}
            onDelete={deleteTask}
          />
        )}

        {page === "stats" && (
          <StatsPage
            isAdmin={isAdmin}
            s_total={s_total}
            s_done={s_done}
            s_todo={s_todo}
            s_inprogress={s_inprogress}
            s_canceled={s_canceled}
            s_overdue={s_overdue}
            s_progress={s_progress}
            perUser={perUser}
          />
        )}

        {page === "tasks" && (
          <TasksPage
            isAdmin={isAdmin}
            users={users}
            currentUser={currentUser}
            filteredTasks={filteredTasks}
            taskFilter={taskFilter}
            setTaskFilter={setTaskFilter}
            userFilter={userFilter}
            setUserFilter={setUserFilter}
            title={title}
            setTitle={setTitle}
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            assignedTo={assignedTo}
            setAssignedTo={setAssignedTo}
            priority={priority}
            setPriority={setPriority}
            description={description}
            setDescription={setDescription}
            addTask={addTask}
            onSetStatus={setTaskStatus}
            onEdit={editTask}
            onDelete={deleteTask}
          />
        )}

        {page === "calendar" && (
          <CalendarPage
            calendarGroups={calendarGroups}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onSetStatus={setTaskStatus}
            onEdit={editTask}
            onDelete={deleteTask}
          />
        )}

        {page === "users" && (
          <UsersPage
            isAdmin={isAdmin}
            users={users}
            newUser={newUser}
            setNewUser={setNewUser}
            newPass={newPass}
            setNewPass={setNewPass}
            newRole={newRole}
            setNewRole={setNewRole}
            addUser={addUser}
            changeRole={changeRole}
            deleteUser={deleteUser}
          />
        )}

        {page === "profile" && (
          <ProfilePage
            currentUser={currentUser}
            profileUsername={profileUsername}
            setProfileUsername={setProfileUsername}
            profileEmail={profileEmail}
            setProfileEmail={setProfileEmail}
            profilePassword={profilePassword}
            setProfilePassword={setProfilePassword}
            profilePassword2={profilePassword2}
            setProfilePassword2={setProfilePassword2}
            saveProfile={saveProfile}
          />
        )}

        {page === "settings" && (
          <SettingsPage
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            exportJSON={exportJSON}
            importJSON={importJSON}
            resetDemo={resetDemo}
          />
        )}
      </div>
    </div>
  </div>
);
}