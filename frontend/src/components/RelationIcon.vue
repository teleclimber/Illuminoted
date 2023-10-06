<script setup lang="ts">

defineProps<{
	label: string,
}>();

</script>

<template>
	<svg v-if="label==='thread-out'" :class="$attrs.class" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" >
		<circle cx="18" cy="18" r="3"></circle>
		<circle cx="6" cy="6" r="3"></circle>
		<path d="M6 21V9a9 9 0 0 0 9 9"></path>
	</svg> 
	<svg v-if="label==='in-reply-to'" :class="$attrs.class" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="rotate-180">
		<path stroke-linecap="round" stroke-linejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
	</svg>
	<svg v-if="label==='see-also'" :class="$attrs.class" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
		<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
		<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
	</svg>
</template>