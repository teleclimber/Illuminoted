<script setup lang="ts">
	import {Ref} from 'vue';
	import type {Note} from '../stores/graph';
	
	defineProps<{
		note: Ref<Note|undefined>,
	}>();
</script>

<template>
	<span v-if="note" class="h-6 inline-block overflow-y-hidden">{{note.value?.contents}}</span>
	<span v-else>Loading...</span>
</template>