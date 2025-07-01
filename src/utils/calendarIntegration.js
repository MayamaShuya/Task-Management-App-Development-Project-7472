// カレンダー連携ユーティリティ

// Google Calendar API設定
const GOOGLE_CALENDAR_CONFIG = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id',
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY || 'your-google-api-key',
  scope: 'https://www.googleapis.com/auth/calendar',
  discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
}

// Microsoft Graph API設定
const MICROSOFT_CONFIG = {
  clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID || 'your-microsoft-client-id',
  redirectUri: window.location.origin,
  scopes: ['https://graph.microsoft.com/calendars.readwrite']
}

class CalendarIntegration {
  constructor() {
    this.googleAuth = null
    this.microsoftAuth = null
    this.isGoogleInitialized = false
    this.isMicrosoftInitialized = false
  }

  // Google Calendar初期化
  async initializeGoogle() {
    try {
      if (this.isGoogleInitialized) return true

      // Google API スクリプトを動的に読み込み
      await this.loadGoogleAPI()
      
      await window.gapi.load('auth2', async () => {
        await window.gapi.auth2.init({
          client_id: GOOGLE_CALENDAR_CONFIG.clientId
        })
        this.googleAuth = window.gapi.auth2.getAuthInstance()
        this.isGoogleInitialized = true
      })

      await window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: GOOGLE_CALENDAR_CONFIG.apiKey,
          clientId: GOOGLE_CALENDAR_CONFIG.clientId,
          discoveryDocs: [GOOGLE_CALENDAR_CONFIG.discoveryDoc],
          scope: GOOGLE_CALENDAR_CONFIG.scope
        })
      })

      return true
    } catch (error) {
      console.error('Google Calendar initialization failed:', error)
      return false
    }
  }

  // Google API スクリプトの動的読み込み
  loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // Microsoft Graph初期化
  async initializeMicrosoft() {
    try {
      if (this.isMicrosoftInitialized) return true

      // MSAL.js を動的に読み込み（デモ用）
      console.log('Microsoft Graph integration initialized (demo mode)')
      this.isMicrosoftInitialized = true
      return true
    } catch (error) {
      console.error('Microsoft Calendar initialization failed:', error)
      return false
    }
  }

  // Google Calendarにログイン
  async signInGoogle() {
    try {
      if (!this.isGoogleInitialized) {
        await this.initializeGoogle()
      }

      if (this.googleAuth.isSignedIn.get()) {
        return { success: true, user: this.googleAuth.currentUser.get() }
      }

      const user = await this.googleAuth.signIn()
      return { success: true, user }
    } catch (error) {
      console.error('Google Calendar sign in failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Microsoft Calendarにログイン
  async signInMicrosoft() {
    try {
      // デモ実装
      console.log('Microsoft Calendar sign in (demo mode)')
      return { 
        success: true, 
        user: { 
          displayName: 'Demo User',
          mail: 'demo@example.com'
        }
      }
    } catch (error) {
      console.error('Microsoft Calendar sign in failed:', error)
      return { success: false, error: error.message }
    }
  }

  // タスクをGoogle Calendarイベントに変換
  taskToGoogleEvent(task) {
    const startDate = task.due_date ? new Date(task.due_date) : new Date()
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1時間後

    return {
      summary: task.title,
      description: task.description || '',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      colorId: this.getPriorityColorId(task.priority),
      extendedProperties: {
        private: {
          taskflowId: task.id,
          taskflowPriority: task.priority,
          taskflowStatus: task.status
        }
      }
    }
  }

  // 優先度に応じたカラーID
  getPriorityColorId(priority) {
    switch (priority) {
      case 'high': return '11' // 赤
      case 'medium': return '5' // 黄
      case 'low': return '10' // 緑
      default: return '1' // 青
    }
  }

  // Google Calendarにタスクを追加
  async addTaskToGoogle(task) {
    try {
      const event = this.taskToGoogleEvent(task)
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      })

      return { success: true, eventId: response.result.id }
    } catch (error) {
      console.error('Failed to add task to Google Calendar:', error)
      return { success: false, error: error.message }
    }
  }

  // Microsoft Calendarにタスクを追加
  async addTaskToMicrosoft(task) {
    try {
      // デモ実装
      console.log('Adding task to Microsoft Calendar (demo):', task.title)
      return { 
        success: true, 
        eventId: 'demo-event-' + Date.now()
      }
    } catch (error) {
      console.error('Failed to add task to Microsoft Calendar:', error)
      return { success: false, error: error.message }
    }
  }

  // Google Calendarからイベントを取得
  async getGoogleEvents(startDate, endDate) {
    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      })

      return { success: true, events: response.result.items }
    } catch (error) {
      console.error('Failed to get Google Calendar events:', error)
      return { success: false, error: error.message }
    }
  }

  // iCalendar形式でエクスポート
  exportToICalendar(tasks) {
    const icalContent = this.generateICalendar(tasks)
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `taskflow-tasks-${new Date().toISOString().split('T')[0]}.ics`
    link.click()
    
    URL.revokeObjectURL(url)
    return { success: true }
  }

  // iCalendar形式を生成
  generateICalendar(tasks) {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TaskFlow//Task Management//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ].join('\r\n') + '\r\n'

    tasks.forEach(task => {
      const startDate = task.due_date ? new Date(task.due_date) : new Date()
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
      
      const startStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      const endStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      
      icalContent += [
        'BEGIN:VEVENT',
        `UID:taskflow-${task.id}@taskflow.app`,
        `DTSTAMP:${timestamp}`,
        `DTSTART:${startStr}`,
        `DTEND:${endStr}`,
        `SUMMARY:${this.escapeICalText(task.title)}`,
        `DESCRIPTION:${this.escapeICalText(task.description || '')}`,
        `PRIORITY:${this.getPriorityNumber(task.priority)}`,
        `STATUS:${this.getICalStatus(task.status)}`,
        `CATEGORIES:TaskFlow,${task.priority.toUpperCase()}`,
        'END:VEVENT'
      ].join('\r\n') + '\r\n'
    })

    icalContent += 'END:VCALENDAR\r\n'
    return icalContent
  }

  // iCalendar用テキストエスケープ
  escapeICalText(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
  }

  // 優先度を数値に変換
  getPriorityNumber(priority) {
    switch (priority) {
      case 'high': return '1'
      case 'medium': return '5'
      case 'low': return '9'
      default: return '5'
    }
  }

  // ステータスをiCalendar形式に変換
  getICalStatus(status) {
    switch (status) {
      case 'completed': return 'COMPLETED'
      case 'in_progress': return 'IN-PROCESS'
      case 'todo': return 'NEEDS-ACTION'
      default: return 'NEEDS-ACTION'
    }
  }

  // iCalendarファイルをインポート
  async importFromICalendar(file) {
    try {
      const text = await file.text()
      const tasks = this.parseICalendar(text)
      return { success: true, tasks }
    } catch (error) {
      console.error('Failed to import iCalendar:', error)
      return { success: false, error: error.message }
    }
  }

  // iCalendarファイルを解析
  parseICalendar(icalText) {
    const tasks = []
    const events = icalText.split('BEGIN:VEVENT')
    
    for (let i = 1; i < events.length; i++) {
      const eventText = events[i].split('END:VEVENT')[0]
      const task = this.parseICalEvent(eventText)
      if (task) {
        tasks.push(task)
      }
    }
    
    return tasks
  }

  // iCalendarイベントを解析
  parseICalEvent(eventText) {
    const lines = eventText.split(/\r?\n/).filter(line => line.trim())
    const task = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()

      switch (key) {
        case 'SUMMARY':
          task.title = this.unescapeICalText(value)
          break
        case 'DESCRIPTION':
          task.description = this.unescapeICalText(value)
          break
        case 'DTSTART':
          task.due_date = this.parseICalDate(value)
          break
        case 'PRIORITY':
          task.priority = this.parsePriorityFromNumber(value)
          break
        case 'STATUS':
          task.status = this.parseStatusFromICal(value)
          break
      }
    })

    return task.title ? task : null
  }

  // iCalendar用テキストのアンエスケープ
  unescapeICalText(text) {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\')
  }

  // iCalendar日付を解析
  parseICalDate(dateStr) {
    if (!dateStr) return null
    
    // YYYYMMDDTHHMMSSZ 形式を ISO 形式に変換
    if (dateStr.length === 16 && dateStr.endsWith('Z')) {
      const year = dateStr.substr(0, 4)
      const month = dateStr.substr(4, 2)
      const day = dateStr.substr(6, 2)
      const hour = dateStr.substr(9, 2)
      const minute = dateStr.substr(11, 2)
      const second = dateStr.substr(13, 2)
      
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString()
    }
    
    return new Date(dateStr).toISOString()
  }

  // 数値から優先度を変換
  parsePriorityFromNumber(priorityNum) {
    const num = parseInt(priorityNum)
    if (num <= 3) return 'high'
    if (num <= 6) return 'medium'
    return 'low'
  }

  // iCalendarステータスを変換
  parseStatusFromICal(status) {
    switch (status) {
      case 'COMPLETED': return 'completed'
      case 'IN-PROCESS': return 'in_progress'
      case 'NEEDS-ACTION': return 'todo'
      default: return 'todo'
    }
  }

  // Apple Calendar用のWebcalリンクを生成
  generateWebcalLink(tasks) {
    const icalContent = this.generateICalendar(tasks)
    const blob = new Blob([icalContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    
    // webcal:// プロトコルでApple Calendarが自動で開く
    const webcalUrl = url.replace('blob:', 'webcal://')
    return webcalUrl
  }

  // カレンダー同期設定を保存
  saveCalendarSettings(settings) {
    localStorage.setItem('calendar-integration-settings', JSON.stringify(settings))
  }

  // カレンダー同期設定を読み込み
  loadCalendarSettings() {
    const saved = localStorage.getItem('calendar-integration-settings')
    return saved ? JSON.parse(saved) : {
      googleEnabled: false,
      microsoftEnabled: false,
      autoSync: false,
      syncInterval: 3600000, // 1時間
      defaultCalendar: 'primary'
    }
  }

  // 自動同期の設定
  setupAutoSync(tasks, updateTasks) {
    const settings = this.loadCalendarSettings()
    
    if (!settings.autoSync) return

    setInterval(async () => {
      try {
        if (settings.googleEnabled && this.googleAuth?.isSignedIn.get()) {
          await this.syncWithGoogle(tasks, updateTasks)
        }
        
        if (settings.microsoftEnabled) {
          await this.syncWithMicrosoft(tasks, updateTasks)
        }
      } catch (error) {
        console.error('Auto sync failed:', error)
      }
    }, settings.syncInterval)
  }

  // Google Calendarとの同期
  async syncWithGoogle(tasks, updateTasks) {
    try {
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      
      const result = await this.getGoogleEvents(now, nextMonth)
      if (!result.success) return

      // TaskFlowのイベントを探す
      const taskflowEvents = result.events.filter(event => 
        event.extendedProperties?.private?.taskflowId
      )

      // 削除されたタスクのイベントを削除
      for (const event of taskflowEvents) {
        const taskId = event.extendedProperties.private.taskflowId
        const task = tasks.find(t => t.id === taskId)
        
        if (!task) {
          await window.gapi.client.calendar.events.delete({
            calendarId: 'primary',
            eventId: event.id
          })
        }
      }

      console.log('Google Calendar sync completed')
    } catch (error) {
      console.error('Google Calendar sync failed:', error)
    }
  }

  // Microsoft Calendarとの同期
  async syncWithMicrosoft(tasks, updateTasks) {
    try {
      // デモ実装
      console.log('Microsoft Calendar sync completed (demo)')
    } catch (error) {
      console.error('Microsoft Calendar sync failed:', error)
    }
  }
}

export default new CalendarIntegration()