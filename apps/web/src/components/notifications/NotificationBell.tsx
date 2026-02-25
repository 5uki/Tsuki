import { useState, useEffect, useCallback, useRef } from 'react'
import type { NotificationDTO } from '@tsuki/shared/dto'
import { getNotifications, getUnreadNotificationCount, markNotificationsRead } from '@/lib/api'
import { formatRelativeTime } from '@tsuki/shared/time'
import './notifications.css'

export interface NotificationBellI18n {
  title: string
  empty: string
  markAllRead: string
  commentReply: string
  commentPinned: string
  commentHidden: string
  commentDeleted: string
}

interface NotificationBellProps {
  i18n?: NotificationBellI18n
}

const POLL_INTERVAL = 60_000

function getNotificationText(n: NotificationDTO, i18n?: NotificationBellI18n): string {
  const actor = n.actor?.login ?? '?'
  switch (n.type) {
    case 'comment_reply':
      return (i18n?.commentReply ?? '{actor} 回复了你的评论').replace('{actor}', actor)
    case 'comment_pinned':
      return i18n?.commentPinned ?? '你的评论被管理员置顶'
    case 'comment_hidden':
      return i18n?.commentHidden ?? '你的评论被管理员隐藏'
    case 'comment_deleted':
      return i18n?.commentDeleted ?? '你的评论被管理员删除'
  }
}

function getTargetUrl(n: NotificationDTO): string {
  if (n.target_type === 'post') return `/posts/${n.target_id}`
  return `/moments/${n.target_id}`
}

export default function NotificationBell({ i18n }: NotificationBellProps) {
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationDTO[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const pollUnread = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount()
      setUnread(count)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    pollUnread()
    const timer = setInterval(pollUnread, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [pollUnread])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleOpen = async () => {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    setLoading(true)
    try {
      const result = await getNotifications()
      setNotifications(result.items)
      if (unread > 0) {
        await markNotificationsRead()
        setUnread(0)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="notif-bell" ref={ref}>
      <button
        className="notif-bell-btn"
        onClick={handleOpen}
        aria-label={i18n?.title ?? 'Notifications'}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-header-title">{i18n?.title ?? '通知'}</span>
          </div>
          <div className="notif-body">
            {loading ? (
              <div className="notif-loading">...</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">{i18n?.empty ?? '暂无通知'}</div>
            ) : (
              notifications.map((n) => (
                <a
                  key={n.id}
                  href={getTargetUrl(n)}
                  className={`notif-item${n.is_read ? '' : ' notif-unread'}`}
                  onClick={() => setOpen(false)}
                >
                  {n.actor && (
                    <img
                      className="notif-avatar"
                      src={n.actor.avatar_url}
                      alt=""
                      width={28}
                      height={28}
                    />
                  )}
                  <div className="notif-content">
                    <span className="notif-text">{getNotificationText(n, i18n)}</span>
                    <span className="notif-time">{formatRelativeTime(n.created_at)}</span>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
