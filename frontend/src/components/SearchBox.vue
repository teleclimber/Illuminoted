<script setup lang="ts">
import { onMounted, ref, Ref, computed } from 'vue';
import { useUIStateStore } from '../stores/ui_state';

const uiStateStore = useUIStateStore();

const input_elem :Ref<HTMLInputElement|undefined> = ref(); 
onMounted( () => {
	input_elem.value?.focus();
});

const in_threads = computed( () => {
	if( !uiStateStore.show_threads ) return false;
	const notes_w = uiStateStore.win_width - uiStateStore.threads_width;
	if( notes_w > uiStateStore.threads_width ) return false;
	return true;
});

const x = computed( () => {
	if( in_threads.value ) return {left: 60, width: uiStateStore.threads_width - 60};
	if( uiStateStore.show_threads ) return {left: uiStateStore.threads_width, width:uiStateStore.win_width - uiStateStore.threads_width};
	return {left:60, width: uiStateStore.win_width -60};
});

function closeSearch() {
	uiStateStore.hideSearch();
}

</script>
<template>
	<div class="absolute top-0 bg-gray-200 p-2 box-border flex " :style="'left:'+x.left+'px; width:'+x.width+'px'">
		<input type="text" ref="input_elem" v-model="uiStateStore.cur_search" class="flex-grow border border-gray-700 bg-white" />
		<span class="ml-2">
			<button @click="closeSearch()"
				class="py-1 px-2 border border-gray-700 text-gray-700 rounded-lg bg-gray-50 hover:bg-yellow-50">
				<svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		
		</span>
	</div>
</template>