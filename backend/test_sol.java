public class SubsetSum {
    public static boolean subsetSum(int[] arr, int targetSum) {
        // 1. Allocate array [0 marks - 1D instead of 2D]
        boolean[] dp = new boolean[targetSum + 1];
        
        // 2. Initialize first column [0 marks - partial initialization]
        dp[0] = true;
        
        // 3. Initialize first row [0 marks - incorrect initialization]
        for (int j = 1; j <= targetSum; j++) {
            for (int num : arr) {
                if (j == num) {
                    dp[j] = true;
                    break;
                }
            }
        }
        
        // 4. Process elements [0 marks - incorrect processing]
        for (int j = 1; j <= targetSum; j++) {
            for (int i = 0; i < arr.length; i++) {
                // 5. Evaluate sums [0 marks - simplified evaluation]
                if (j >= arr[i]) {
                    // 6. Handling element value [0 marks - oversimplified condition]
                    dp[j] = dp[j] || dp[j - arr[i]];
                }
            }
        }
        
        // 7. Return result [0 marks - incorrect return]
        return dp[targetSum] && targetSum <= findMax(arr);
    }
    
    // Helper method to find max
    private static int findMax(int[] arr) {
        int max = arr[0];
        for (int num : arr) {
            if (num > max) {
                max = num;
            }
        }
        return max;
    }
    
    public static void main(String[] args) {
        int[] arr = {3, 34, 4, 12, 5, 2};
        int targetSum = 9;
        System.out.println(subsetSum(arr, targetSum));
    }
}