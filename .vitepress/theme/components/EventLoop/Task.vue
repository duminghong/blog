<script setup>
import { Colors } from './config.js';

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  hidden: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <el-badge
    value="···"
    :hidden="!task.createTask || !task.createTask.type || hidden"
    :color="task.createTask ? Colors[task.createTask.type]?.text : 'transparent'"
  >
    <el-tag
      effect="dark"
      :color="Colors[task.type].text"
      :class="`task-${task.status}`"
      :style="{ borderColor: Colors[task.type].border }"
      disable-transitions
    >
      {{ task.taskName }}
    </el-tag>
  </el-badge>
</template>

<style lang="less" scoped></style>
