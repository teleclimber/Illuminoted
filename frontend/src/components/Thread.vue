<script setup lang="ts">
import {ref, computed} from 'vue';
import { page_control } from '../main';
import ThreadUI from './Thread.vue';
import type {Thread} from '../models/graph';
const props = defineProps<{
	thread: Thread,
	is_root?: boolean
}>();

const emit = defineEmits<{
	(e: 'thread-clicked', id: number):void
}>();

const show_full = ref(false);

const is_filter = computed( () => {
	return page_control.filter_thread.value === props.thread.id;
});
</script>

<template>
	<div class="border-blue-500 pl-2" :class="{'border-l': !props.is_root}">
		<div class="pt-1 flex flex-wrap cursor-pointer hover:bg-yellow-50 md:flex-nowrap"  @click="$emit('thread-clicked', thread.id)">
			<div class="w-1/2 md:w-auto flex-shrink-0 text-gray-500 order-2 ">{{props.thread.created.toLocaleDateString()}}</div>
			<div class="flex-grow w-full md:w-auto"
				:class="{'h-6':!show_full, 'overflow-y-hidden':!show_full}"
				@click="show_full = !show_full">{{props.thread.contents}}</div>

			<div class="w-1/2 md:w-auto order-3 flex justify-end">
				<div class="px-2 text-gray-500" :class="{'text-blue-600':is_filter, 'bg-yellow-200':is_filter}" @click.stop.prevent="page_control.filter(props.thread.id)">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
					</svg>
				</div>
				<a :href="'/'+thread.id" class="px-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
					</svg>
				</a>
			</div>
		</div>
		<ThreadUI v-for="t in props.thread.children" :thread="t"></ThreadUI>
	</div>

</template>