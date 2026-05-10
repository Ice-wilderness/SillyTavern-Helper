<template>
	<div class="convenient-edit-extension-settings">
		<div class="inline-drawer">
			<div class="inline-drawer-toggle inline-drawer-header">
				<b>{{ `✏️更好的小铅笔` }}</b>
				<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
			</div>
			<div class="inline-drawer-content">
				<div class="convenient-edit-extension_block flex-container">
					<input v-model="settings.showButton" type="checkbox" id="show-button-checkbox" />
					<label for="show-button-checkbox">{{ `显示悬浮编辑按钮` }}</label>
				</div>
				<hr class="sysHR" />
				<div class="hint">
					<span>提示：选取文本按下按钮或 F8 快捷键可定位修改，再次点击按钮或空白处可保存</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSettingsStore } from './settings';

const { settings } = storeToRefs(useSettingsStore());
</script>

<style scoped>
.hint {
	opacity: 0.7;
	font-size: 12px;
}
.flex-container {
	display: flex;
	align-items: center;
	gap: 8px;
}
</style>
