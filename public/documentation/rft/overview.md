# Explanation:
![Screenshot 2024-09-13 105124](https://github.com/user-attachments/assets/e7b3e260-22f6-48b0-bdf1-f3bb57a4832a)

-> We are using the property: a^m*a^n=a^m+n

-> If the power is odd,then we have to multipy the base again,other wise the multiplication of half powers is enough

# Time Complexity
 ->As we are reducing the power by half at each step->R to R/2
 
 ->The recursion depth will be equal to number of times we can divide the power by 2 till it reaches 1

 ->If r=16,you divide it with 2,4 times-> 16->8->4->2->1

 ->If r=32,you divide it with 2,5 times-> 32->16->8->4->2->1

 ->The time complexity is logarithmic with base 2->O(logn)

 # Space complexity:

 ->The variables we use take constant space
 
 ->The recursion stack takes O(logn) space as it's depth is max of O(logn)
