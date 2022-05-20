<script setup lang="ts">
	import type {Thread} from '../models/graph';
	const props = defineProps<{
		thread: Thread
	}>();

	const emit = defineEmits<{
		(e: 'thread-clicked', id: number):void
	}>();
</script>

<template>
	<div class="border-b border-l pl-1 py-2 flex cursor-pointer hover:bg-yellow-50" :style="{'margin-left': props.thread.depth * 10 + 'px'}"  @click="$emit('thread-clicked', thread.thread)">
		<div class="font-bold flex-shrink max-w-prose whitespace-nowrap overflow-clip">{{props.thread.root.contents}}</div>
		<div class="w-52 pl-2 flex-shrink-0 text-gray-500">({{props.thread.root.created.toLocaleDateString()}})</div>
	</div>

</template>