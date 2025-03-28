// Java program to remove consonants from a String

class Solution {

	// function that returns true
	// if the character is an alphabet
	static boolean isAlphabet(char ch)
	{
		if (ch >= 'a' && ch <= 'z')
			return true;
		if (ch >= 'A' && ch <= 'Z')
			return true;
		return false;
	}

	// function to return the string after
	// removing all the consonants from it
	static String remConsonants(String str)
	{
		Character vowels[]
			= { 'a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U' };

		List<Character> al = Arrays.asList(vowels);

		StringBuffer sb = new StringBuffer(str);

		for (int i = 0; i < sb.length(); i++) {

			if (isAlphabet(sb.charAt(i))
				&& !al.contains(sb.charAt(i))) {
				sb.replace(i, i + 1, "");
				i--;
			}
		}

		return sb.toString();
	}


}
