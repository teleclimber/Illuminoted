import { ref , watch} from "vue";
import { notes_graph } from "./main";

export default class SearchControl {
	cur_search = ref('');

	constructor() {
		watch( this.cur_search, (s) => {
			notes_graph.setSearchTerm(s);
		});
	}
}