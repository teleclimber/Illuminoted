<script setup lang="ts">
import { onMounted, ref, Ref } from 'vue';
import { usePageControlStore } from '../page_control';
import { useSearchControlStore } from '../search';

const pageStore = usePageControlStore();
const searchStore = useSearchControlStore();

const input_elem :Ref<HTMLInputElement|undefined> = ref(); 
onMounted( () => {
	input_elem.value?.focus();
});

function closeSearch() {
	searchStore.cur_search = '';
	pageStore.hideSearch();
}

</script>
<template>
	<div class="flex">
		<input type="text" ref="input_elem" v-model="searchStore.cur_search" />
		<span>
			<svg @click="closeSearch()" class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</span>
	</div>
</template>