/**
 * 老式收音机风格音效工具
 *
 * 使用 Web Audio API 合成音效，不依赖外部音频文件。
 * 音效风格参考老式收音机的"滴答"声和机械反馈音。
 */

let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      console.warn('[sound] Web Audio API not available')
      return null
    }
  }
  // 恢复被浏览器挂起的 AudioContext
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/**
 * 创建噪音缓冲（用于收音机白噪音效果）
 */
function createNoiseBuffer(ctx, duration = 0.05) {
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3
  }
  return buffer
}

/**
 * 成功音效 — 短促清脆 "叮"（类似收音机开关）
 */
export function playSuccessSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime

  // 主音：740Hz 短促双音
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(740, now)
  osc1.frequency.setValueAtTime(880, now + 0.06)
  gain1.gain.setValueAtTime(0.18, now)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
  osc1.connect(gain1).connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + 0.2)

  // 倍频谐波
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(1480, now)
  osc2.frequency.setValueAtTime(1760, now + 0.06)
  gain2.gain.setValueAtTime(0.08, now)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
  osc2.connect(gain2).connect(ctx.destination)
  osc2.start(now)
  osc2.stop(now + 0.15)
}

/**
 * 点击音效 — 轻微"咔嗒"声（机械键盘感觉）
 */
export function playTapSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime

  // 短脉冲噪音 + 低频
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(220, now)
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.03)
  gain.gain.setValueAtTime(0.1, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.04)
}

/**
 * 摇一摇检测音 — 收音机调频噪音（白噪音 burst）
 */
export function playShakeDetectedSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime

  // 噪音脉冲
  const noiseBuffer = createNoiseBuffer(ctx, 0.12)
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer

  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.setValueAtTime(1200, now)
  noiseFilter.frequency.exponentialRampToValueAtTime(400, now + 0.1)
  noiseFilter.Q.setValueAtTime(0.8, now)

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.15, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

  noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination)
  noise.start(now)
  noise.stop(now + 0.15)

  // 伴随一个低音滴声
  const osc = ctx.createOscillator()
  const oscGain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, now)
  osc.frequency.setValueAtTime(260, now + 0.08)
  oscGain.gain.setValueAtTime(0.12, now)
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
  osc.connect(oscGain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.18)
}

/**
 * 删除音效 — 低沉下行"咚"（类似旧收音机关闭声）
 */
export function playDeleteSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(330, now)
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.2)
  gain.gain.setValueAtTime(0.2, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.25)
}

/**
 * 开关切换音 — 类似收音机旋钮拨动
 */
export function playToggleSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(600, now)
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.05)
  gain.gain.setValueAtTime(0.06, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.08)
}
