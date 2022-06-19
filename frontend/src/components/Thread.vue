<script setup lang="ts">
	import ThreadUI from './Thread.vue';
	import type {Thread} from '../models/graph';
	const props = defineProps<{
		thread: Thread,
		is_root?: boolean
	}>();

	const emit = defineEmits<{
		(e: 'thread-clicked', id: number):void
	}>();
</script>

<template>
	<div class="border-blue-500 pl-2" :class="{'border-l': !props.is_root}">
		<div class="pt-1 flex flex-wrap cursor-pointer hover:bg-yellow-50 md:flex-nowrap"  @click="$emit('thread-clicked', thread.id)">
			<div class="w-1/2 md:w-auto flex-shrink-0 text-gray-500 order-2 ">{{props.thread.created.toLocaleDateString()}}</div>
			<div class="flex-grow w-full h-6 overflow-y-hidden md:w-auto">{{props.thread.contents}}</div>

			<div class="w-1/2 md:w-auto order-3 flex justify-end">
				<a :href="'/'+thread.id">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
					</svg>
				</a>
			</div>
		</div>
		<ThreadUI v-for="t in props.thread.children" :thread="t"></ThreadUI>
	</div>

</template>