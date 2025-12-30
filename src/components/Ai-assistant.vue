<template>
  <div class="ai-assistant">
    <!-- 悬浮球 -->
    <div
      v-if="!isOpen"
      class="ai-fab"
      @click="toggleOpen"
      title="打开 AI 助手"
    >
      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
        <rect x="5" y="9" width="14" height="10" rx="2"></rect>
        <path d="M9 22v-3"></path>
        <path d="M15 22v-3"></path>
        <path d="M9 9l-2-2"></path>
        <path d="M15 9l2-2"></path>
      </svg>
    </div>

    <!-- 聊天窗口 -->
    <div v-else class="chat-window">
      <div class="chat-header">
        <span>智能单证助手</span>
        <span class="close-btn" @click="toggleOpen">×</span>
      </div>

      <!--
        [修改] 增加 @click="handleMessageClick"
        用于拦截气泡内部的点击事件（如选择文件链接）
      -->
      <div class="chat-messages" ref="messagesRef" @click="handleMessageClick">
        <div
          v-for="(msg, index) in messageList"
          :key="index"
          :class="['message-item', msg.role === 'user' ? 'user-msg' : 'ai-msg']"
        >
          <div class="avatar">{{ msg.role === 'user' ? '👨‍💻' : '🤖' }}</div>

          <div class="content-wrapper">
            <div class="content" v-html="formatContent(msg.content)"></div>

            <div v-if="msg.actions" class="msg-actions">
              <button class="action-btn record-btn" @click.stop="handleAction('record')">
                💾 帮我记
              </button>
              <button class="action-btn upload-btn" @click.stop="handleAction('upload')">
                📂 帮我存
              </button>
              <button class="action-btn fill-btn" @click.stop="handleAction('fill')">
                📝 帮我写
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <input
          v-model="inputText"
          type="text"
          placeholder="请输入指令..."
          @keyup.enter="handleSend"
        />
        <button @click="handleSend" :disabled="!inputText.trim()">发送</button>
      </div>

      <input
        type="file"
        ref="fileInputRef"
        style="display: none"
        @change="handleFileSelected"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, defineExpose, defineEmits } from 'vue'

// [修改] 增加 'handle-select-file' 事件
const emit = defineEmits(['handle-record', 'handle-upload', 'handle-fill', 'handle-query-files', 'handle-select-file'])

const isOpen = ref(false)
const inputText = ref('')
const messagesRef = ref(null)
const fileInputRef = ref(null)

const messageList = ref([
  {
    role: 'ai',
    content: '您好！我是智能助手。请选择操作：<br/><b>帮我记</b>：抓取当前表单存入保管箱<br/><b>帮我存</b>：上传本地文件到保管箱<br/><b>帮我写</b>：下载保管箱数据回填表单<br/>您也可以直接问我：“我有哪些单证？”',
    actions: true
  }
])

const toggleOpen = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) scrollToBottom()
}

const addAiMessage = (text) => {
  if (!isOpen.value) isOpen.value = true
  messageList.value.push({ role: 'ai', content: text })
  scrollToBottom()
}

// [新增] 处理消息区域的点击拦截
const handleMessageClick = (e) => {
  const target = e.target.closest('a');
  if (target && target.href) {
    // 检查是否是自定义协议 action://
    if (target.href.includes('action://select-file')) {
      e.preventDefault(); // 阻止跳转
      // 解析参数 name
      const url = new URL(target.href);
      const fileName = url.searchParams.get('name');
      if (fileName) {
        emit('handle-select-file', fileName);
      }
    }
  }
}

const handleAction = (type) => {
  if (type === 'record') {
    messageList.value.push({ role: 'user', content: '帮我记' })
    emit('handle-record')
  } else if (type === 'upload') {
    fileInputRef.value.click()
  } else if (type === 'fill') {
    messageList.value.push({ role: 'user', content: '帮我写' })
    emit('handle-fill')
  }
  scrollToBottom()
}

const handleFileSelected = (event) => {
  const file = event.target.files[0]
  if (file) {
    messageList.value.push({ role: 'user', content: `帮我存：${file.name}` })
    emit('handle-upload', file)
    event.target.value = ''
  }
  scrollToBottom()
}

const handleSend = () => {
  const text = inputText.value.trim()
  if (!text) return

  messageList.value.push({ role: 'user', content: text })
  inputText.value = ''
  scrollToBottom()

  if (/记|record/.test(text)) {
    emit('handle-record')
  } else if (/存|upload|上传/.test(text)) {
    fileInputRef.value.click()
  } else if (/写|填|fill/.test(text)) {
    emit('handle-fill')
  } else if (/我有哪些|文件列表|list/.test(text)) {
    emit('handle-query-files')
  } else {
    setTimeout(() => {
      addAiMessage('请点击上方按钮或输入：帮我记、帮我存、帮我写')
    }, 500)
  }
}

const formatContent = (text) => {
  if (text.includes('<')) return text
  return text.replace(/\n/g, '<br/>')
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

defineExpose({ addAiMessage })
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.ai-fab {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #3a8ee6);
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease;
  color: white;
}
.ai-fab:hover { transform: scale(1.1); }
.chat-window {
  width: 360px;
  height: 520px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #ebeef5;
}
.chat-header {
  height: 45px;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  font-weight: bold;
}
.close-btn { cursor: pointer; font-size: 20px; }
.chat-messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.message-item { display: flex; gap: 10px; max-width: 90%; }
.user-msg { align-self: flex-end; flex-direction: row-reverse; }
.ai-msg { align-self: flex-start; }
.avatar {
  width: 32px; height: 32px; border-radius: 50%; background-color: #e6e8eb;
  display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;
}
.content-wrapper { display: flex; flex-direction: column; gap: 8px; max-width: 100%; }
.content {
  background-color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 14px;
  line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.05); word-break: break-all;
}
.user-msg .content { background-color: #95d475; color: #303133; }
.msg-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.action-btn {
  border: none; padding: 6px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;
  transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.record-btn { background-color: #ecf5ff; color: #409eff; border: 1px solid #d9ecff; }
.record-btn:hover { background-color: #c6e2ff; }
.upload-btn { background-color: #fdf6ec; color: #e6a23c; border: 1px solid #faecd8; }
.upload-btn:hover { background-color: #f5dab1; }
.fill-btn { background-color: #f0f9eb; color: #67c23a; border: 1px solid #e1f3d8; }
.fill-btn:hover { background-color: #d1edc4; }

.chat-input-area {
  height: 50px; border-top: 1px solid #e4e7ed; display: flex; padding: 8px; background: #fff;
}
.chat-input-area input {
  flex: 1; border: 1px solid #dcdfe6; border-radius: 4px; padding: 0 10px; outline: none;
}
.chat-input-area button {
  margin-left: 8px; padding: 0 15px; background-color: #409eff; color: white;
  border: none; border-radius: 4px; cursor: pointer;
}
.chat-input-area button:disabled { background-color: #a0cfff; }
</style>
