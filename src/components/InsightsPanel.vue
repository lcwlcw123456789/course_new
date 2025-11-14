<template>
  <div :class="['insights', { visible: true }]">
    <h3 class="title">
      <span>{{ title }}</span>
      <button class="close-btn" @click="$emit('close')">❌</button>
    </h3>

    <div v-if="mode === 'recommendations'" class="cards">
      <div class="card">
        <h4>最稳定 Top 5</h4>
        <ol>
          <li v-for="i in data.stable" :key="'s-'+i.category">
            <strong>{{ i.category }}</strong>
            <small> 波动率 {{ formatPercent(i.volatility) }}</small>
          </li>
        </ol>
      </div>
      <div class="card">
        <h4>涨幅最大 Top 5（年均）</h4>
        <ol>
          <li v-for="i in data.growth" :key="'g-'+i.category">
            <strong>{{ i.category }}</strong>
            <small> CAGR {{ formatPercent(i.cagr) }}</small>
          </li>
        </ol>
      </div>
      <div class="card">
        <h4>最近三年最热 Top 5</h4>
        <ol>
          <li v-for="i in data.trending" :key="'t-'+i.category">
            <strong>{{ i.category }}</strong>
            <small> 近三年 {{ formatPercent(i.lastThreeYearGrowth) }}</small>
          </li>
        </ol>
      </div>
    </div>

    <div v-else-if="mode === 'correlations'" class="cards">
      <div class="card">
        <h4>与 {{ category }} 高相关的食品</h4>
        <ol>
          <li v-for="c in data" :key="c.category">
            <strong>{{ c.category }}</strong>
            <small> 相关系数 {{ c.correlation.toFixed(2) }}</small>
          </li>
        </ol>
        <p class="tip">提示：相关不等同于因果，需结合业务理解</p>
      </div>
    </div>

    <div v-else class="empty">暂无数据</div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '智能推荐' },
  mode: { type: String, default: 'recommendations' },
  data: { type: Object, default: () => ({}) },
  category: { type: String, default: '' },
});

function formatPercent(v) {
  return (v * 100).toFixed(2) + '%';
}
</script>

<style scoped>
.insights {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #fff;
  border: 1px solid #ddd;
  box-sizing: border-box;
  padding-bottom: 8px;
  opacity: 0;
  transition: opacity .25s ease;
}
.visible { opacity: 1; }

.title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
  font-size: 18px;
  padding: 10px 16px;
  border-bottom: 1px solid #eee;
}
.close-btn {
  font-size: 13px;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  padding: 12px;
  overflow: auto;
}
.card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fafafa;
}
.card h4 { margin: 0 0 8px 0; font-size: 14px; }
.card ol { margin: 0; padding-left: 18px; }
.card li { margin: 4px 0; }
.tip { color: #777; font-size: 12px; margin-top: 8px; }
.empty { padding: 16px; color: #777; }
</style>

