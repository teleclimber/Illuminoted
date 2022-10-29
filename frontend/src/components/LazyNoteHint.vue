<script setup lang="ts">
	import {computed, toRefs, Ref} from 'vue';
	import type {Note} from '../models/graph';
	
	const props = defineProps<{
		note: Ref<Note|undefined>,
	}>();
	const {note} = toRefs(props);
</script>

<template>
	<span v-if="note" class="h-6 inline-block overflow-y-hidden">{{note.contents}}</span>
	<span v-else>Loading...</span>
</template>