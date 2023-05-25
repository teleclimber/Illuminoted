import { ref , watch} from "vue";
import { defineStore } from 'pinia';
import { useNotesGraphStore } from './models/graph';

export const useSearchControlStore = defineStore('search-control', () => {
	const notesStore = useNotesGraphStore();

	const cur_search = ref('');
	
	watch( cur_search, (s) => {
		notesStore.setSearchTerm(s);
	});

	return {
		cur_search
	}
});